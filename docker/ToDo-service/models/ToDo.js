const mongoose = require('mongoose');

const toDoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Text for to-do is required'],
    minlength: 1,
    maxlength: 280
  },
  completed: {
    type: Boolean,
    default: false
  },
  comments: [{
    type: String
  }],
  editing: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

toDoSchema.statics.toggleCompleted = async function(id) {
  const todo = await this.findById(id);
  todo.completed = !todo.completed;
  return todo.save();
};

const ToDo = mongoose.model('ToDo', toDoSchema);

module.exports = ToDo;
