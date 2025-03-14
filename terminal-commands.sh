# Update package.json with the necessary scripts
cat > package.json << EOL
{
  "name": "buelldocs",
  "version": "1.0.0",
  "description": "Initial upload of BuellDocs website",
  "main": "server.js",
  "directories": {
    "doc": "docs"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.20.3",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "helmet": "^8.0.0",
    "nodemon": "^3.1.9",
    "pg": "^8.14.0"
  },
  "devDependencies": {}
}
EOL

# Create the server.js file if it doesn't exist
cat > server.js << EOL
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
EOL

# Now try running the dev script
npm run dev