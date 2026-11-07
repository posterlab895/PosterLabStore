const fs = require('fs');

const carCode = fs.readFileSync('cars-products.js', 'utf8');
const movieCode = fs.readFileSync('movie-artist-products.js', 'utf8');

function extractPaths(code) {
  const list = [];
  const lines = code.split('\n');
  for (const l of lines) {
    const trimmed = l.trim();
    if (trimmed.startsWith('{"id":')) {
      const clean = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
      try {
        const obj = JSON.parse(clean);
        list.push({ id: obj.id, image: obj.image });
      } catch (e) {}
    }
  }
  return list;
}

const cars = extractPaths(carCode);
const movies = extractPaths(movieCode);

console.log('Cars count:', cars.length, 'first:', cars[0], 'last:', cars[cars.length - 1]);
console.log('Movies count:', movies.length, 'first:', movies[0], 'last:', movies[movies.length - 1]);

fs.writeFileSync('cars_list.json', JSON.stringify(cars, null, 2));
fs.writeFileSync('movies_list.json', JSON.stringify(movies, null, 2));
