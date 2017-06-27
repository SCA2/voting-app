'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
  poll: Schema.Types.Mixed,
  author: {type: String, ref: 'User'}
});

module.exports = mongoose.model('Poll', Poll);
