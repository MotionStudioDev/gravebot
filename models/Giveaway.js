const mongoose = require('../database/mongoose');
const { Schema } = mongoose;

const giveawaySchema = new Schema({
  messageId:    { type: String, required: true, unique: true },
  channelId:    { type: String, required: true },
  guildId:      { type: String, required: true },
  hostId:       { type: String, required: true },
  prize:        { type: String, required: true },
  winnerCount:  { type: Number, default: 1 },
  participants: { type: [String], default: [] },
  winners:      { type: [String], default: [] },
  endsAt:       { type: Date, required: true },
  ended:        { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Giveaway', giveawaySchema);
