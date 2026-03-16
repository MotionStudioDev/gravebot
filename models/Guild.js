const mongoose = require('../database/mongoose');
const { Schema } = mongoose;

const guildSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  prefix: {
    type: String,
    default: 'g!'
  },
  moderationLogChannel: {
    type: String,
    default: null
  },
  welcomeChannel: {
    type: String,
    default: null
  },
  goodbyeChannel: {
    type: String,
    default: null
  },
  autoRole: {
    type: String,
    default: null
  },
  mutedRole: {
    type: String,
    default: null
  },
  staffRoles: {
    type: [String],
    default: []
  },
  welcomeMessage: {
    type: String,
    default: 'Sunucumuza hoş geldin {user}!'
  },
  goodbyeMessage: {
    type: String,
    default: 'Sunucudan ayrıldı {user}!'
  },
  caseCounter: {
    type: Number,
    default: 1
  },
  settings: {
    antiSpam: {
      enabled: { type: Boolean, default: false },
      maxMessages: { type: Number, default: 5 },
      timeWindow: { type: Number, default: 5000 },
      punishment: { type: String, default: 'mute' }
    },
    antiLink: {
      enabled: { type: Boolean, default: false },
      punishment: { type: String, default: 'warn' }
    },
    antiSwear: {
      enabled: { type: Boolean, default: false },
      words: { type: [String], default: [] },
      punishment: { type: String, default: 'warn' }
    },
    antiAdvert: {
      enabled: { type: Boolean, default: false },
      punishment: { type: String, default: 'warn' }
    },
    antiCaps: {
      enabled: { type: Boolean, default: false },
      maxCapsPercent: { type: Number, default: 70 },
      punishment: { type: String, default: 'warn' }
    },
    antiFlood: {
      enabled: { type: Boolean, default: false },
      maxLines: { type: Number, default: 5 },
      punishment: { type: String, default: 'mute' }
    },
    antiRaid: {
      enabled: { type: Boolean, default: false },
      maxJoinsPerMinute: { type: Number, default: 10 },
      punishment: { type: String, default: 'kick' }
    },
    antiMention: {
      enabled: { type: Boolean, default: false },
      maxMentions: { type: Number, default: 5 },
      punishment: { type: String, default: 'warn' }
    },
    antiEmoji: {
      enabled: { type: Boolean, default: false },
      maxEmojis: { type: Number, default: 5 },
      punishment: { type: String, default: 'warn' }
    },
    customWords: {
      enabled: { type: Boolean, default: false },
      words: { type: [String], default: [] },
      punishment: { type: String, default: 'warn' }
    },
    mediaProtection: {
      enabled: { type: Boolean, default: false },
      allowedChannels: { type: [String], default: [] },
      punishment: { type: String, default: 'warn' }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Guild', guildSchema);
