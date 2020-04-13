'use stric'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userProfileSchema = Schema({
	user: { type: Schema.ObjectId, ref:'User' },
	image:String
});

module.exports = mongoose.model('UserProfile',userProfileSchema);