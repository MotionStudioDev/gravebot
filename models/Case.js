const mongoose = require('../database/mongoose');
const { Schema } = mongoose;

const caseSchema = new Schema({
  guildId: {
    type: String,
    required: true
  },
  caseId: {
    type: Number,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  moderatorId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ban', 'kick', 'mute', 'unmute', 'warn', 'clear']
  },
  reason: {
    type: String,
    default: 'Belirtilmemiş'
  },
  duration: {
    type: Number,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);
