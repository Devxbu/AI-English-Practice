const player = require('play-sound')();
const fs = require('fs');

module.exports.playMP3 = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error('File not found: ' + filePath));
        }

        player.play(filePath, (err) => {
            if (err) {
                console.error('Play error:', err);
                return reject(err);
            } else {
                console.log('Playback finished');
                fs.unlink(filePath, () => {});
                resolve();
            }
        });
    });
};
