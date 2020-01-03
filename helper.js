const crypto = require('crypto');

function generateUuid() {
    let uuid = crypto.randomBytes(16);
    uuid[6] = 0x40 | (uuid[6] & 0xf);
    uuid[8] = 0x80 | (uuid[8] & 0x3f);
    uuid = uuid.toString('hex');
    return uuid.substr(0, 8) + '-' + uuid.substr(8, 4) + '-' + uuid.substr(12, 4) + '-' + uuid.substr(16, 4) + '-' + uuid.substr(20, 12);
}

module.exports.generateUuid = generateUuid;