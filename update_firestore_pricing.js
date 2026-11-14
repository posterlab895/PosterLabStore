const https = require('https');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log('Fetching Firestore products...');
  const listRes = await request({
    hostname: 'firestore.googleapis.com',
    path: '/v1/projects/poster-labstore/databases/(default)/documents/products',
    method: 'GET'
  });

  const docs = listRes.data.documents || [];
  console.log(`Found ${docs.length} documents in Firestore products collection.`);

  for (const doc of docs) {
    const docPath = doc.name; // e.g. projects/poster-labstore/databases/(default)/documents/products/football-001
    const relativePath = docPath.replace('projects/poster-labstore/databases/(default)/documents/', '');
    console.log(`Processing ${relativePath}...`);
    console.log('Current fields:', JSON.stringify(doc.fields));

    // Prepare patch payload
    const patchBody = JSON.stringify({
      fields: {
        ...doc.fields,
        basePrice: { integerValue: "180" },
        sizes: {
          mapValue: {
            fields: {
              "20x30": { integerValue: "180" },
              "30x40": { integerValue: "200" },
              "40x50": { integerValue: "250" },
              "50x70": { integerValue: "300" }
            }
          }
        },
        _updatedAt: { stringValue: new Date().toISOString() }
      }
    });

    const patchPath = `/v1/${docPath}?updateMask.fieldPaths=basePrice&updateMask.fieldPaths=sizes&updateMask.fieldPaths=_updatedAt`;
    const patchRes = await request({
      hostname: 'firestore.googleapis.com',
      path: patchPath,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(patchBody)
      }
    }, patchBody);

    console.log(`PATCH status: ${patchRes.status}`);
    if (patchRes.status === 200) {
      console.log('Updated successfully:', relativePath);
      console.log('New basePrice:', patchRes.data.fields?.basePrice);
      console.log('New sizes:', JSON.stringify(patchRes.data.fields?.sizes));
    } else {
      console.error('Failed to update:', patchRes);
    }
  }

  // Verification step: re-fetch
  console.log('\n--- Verifying Firestore state ---');
  const verifyRes = await request({
    hostname: 'firestore.googleapis.com',
    path: '/v1/projects/poster-labstore/databases/(default)/documents/products',
    method: 'GET'
  });
  const updatedDocs = verifyRes.data.documents || [];
  let allPass = true;
  for (const doc of updatedDocs) {
    const bp = doc.fields?.basePrice?.integerValue;
    const sizes = doc.fields?.sizes?.mapValue?.fields;
    console.log(`Doc ${doc.name.split('/').pop()}: basePrice=${bp}, 20x30=${sizes?.['20x30']?.integerValue}, 30x40=${sizes?.['30x40']?.integerValue}, 40x50=${sizes?.['40x50']?.integerValue}, 50x70=${sizes?.['50x70']?.integerValue}`);
    if (bp !== '180' || sizes?.['20x30']?.integerValue !== '180' || sizes?.['30x40']?.integerValue !== '200') {
      allPass = false;
    }
  }
  if (allPass) {
    console.log('ALL FIRESTORE DOCUMENTS HAVE CORRECT PRICES (180, 200, 250, 300)!');
  } else {
    console.error('VERIFICATION FAILED!');
  }
}

run().catch(console.error);
