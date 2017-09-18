const uuid = require('uuid');
const Canvas = require('canvas');
const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis').createClient({
  port: 6378,
  db: 2,
  return_buffers: true
}));

module.exports = {
  createPreview: (uuid, previewName, points) => {
    console.log(uuid, previewName, points);
    const Image = Canvas.Image;
    const canvas = new Canvas(550 / 5, 550 / 5);
    const ctx = canvas.getContext('2d');

    return redis.hgetAsync(uuid, 'data').then(image => {

      const img = new Image;
      img.src = image;
      ctx.drawImage(img, 0, 0, img.width / 5, img.height / 5);
      ctx.beginPath();
      points.forEach(point => {
        const {x, y} = point;
        ctx.lineTo(x/5, y/5)
      });
      const {x, y} = points[0];
      ctx.lineTo(x/5, y/5);
      ctx.stroke();
      return redis.hsetAsync(uuid, previewName, canvas.toBuffer());
    });
  }
};
