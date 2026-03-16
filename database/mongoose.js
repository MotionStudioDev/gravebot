const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı!'))
.catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

module.exports = mongoose;
