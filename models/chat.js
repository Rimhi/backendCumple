'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var chatSchema = Schema({
	created_at: String,
	emiter: { type: Schema.ObjectId, ref:'User' },
	receiver: { type:Schema.ObjectId,ref:'User' }
});

module.exports = mongoose.model('Chat',chatSchema);