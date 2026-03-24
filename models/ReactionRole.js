const mongoose = require('../database/mongoose');
const { Schema } = mongoose;

const reactionRoleSchema = new Schema({
  guildId:     { type: String, required: true },
  messageId:   { type: String, required: true, unique: true },
  channelId:   { type: String, required: true },
  title:       { type: String, default: '🎭 Rol Seçimi' },
  description: { type: String, default: 'Aşağıdaki butonlara tıklayarak rol alabilirsin.' },
  color:       { type: String, default: '5865F2' },
  roles: [{
    emoji:  { type: String, required: true },
    roleId: { type: String, required: true },
    label:  { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ReactionRole', reactionRoleSchema);
