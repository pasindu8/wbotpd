const fs = require('fs');
const path = require('path');

const authFile = path.join(__dirname, 'auth_info.json');

// Create auth_info.json if not exists
if (!fs.existsSync(authFile)) {
    fs.writeFileSync(authFile, '{}');
}
