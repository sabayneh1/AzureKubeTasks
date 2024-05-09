// const mongoose = require('mongoose');

// const toDoSchema = new mongoose.Schema({
//   text: {
//     type: String,
//     required: [true, 'Text for to-do is required'],
//     minlength: 1,
//     maxlength: 280 // Assuming a maximum length for the to-do text
//   },
//   completed: {
//     type: Boolean,
//     default: false
//   }
// }, {
//   timestamps: true // Automatically adds createdAt and updatedAt fields
// });

// // Example of a custom static method
// toDoSchema.statics.toggleCompleted = async function(id) {
//   const todo = await this.findById(id);
//   todo.completed = !todo.completed;
//   return todo.save();
// }

// const ToDo = mongoose.model('ToDo', toDoSchema);

// module.exports = ToDo;


const mongoose = require('mongoose');

const toDoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Text for to-do is required'],
    minlength: 1,
    maxlength: 280 // Retaining your maximum length constraint
  },
  completed: {
    type: Boolean,
    default: false
  },
  comments: [{
    type: String
  }], // Added an array of strings to hold comments
  editing: {
    type: Boolean,
    default: false // Field to determine if the ToDo is in editing mode
  }
}, {
  timestamps: true // Retains the automatically added createdAt and updatedAt fields
});

// Keeping your existing custom static method
toDoSchema.statics.toggleCompleted = async function(id) {
  const todo = await this.findById(id);
  todo.completed = !todo.completed;
  return todo.save();
};

const ToDo = mongoose.model('ToDo', toDoSchema);

module.exports = ToDo;
