(function () {
	'use strict';

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	var LOCAL_STORAGE_KEY = 'todos-consistent.js';
	
	// Set up the Todo class, instances of this class will be the scope for each todo item
	var Todo = function(opts) {
		var todo = this;
		todo.title = opts.title;
		todo.savedTitle = opts.title;
		todo.completed = opts.completed || false;
		todo.editing = false;
	};
	
	Todo.prototype.modes = function() {
		var result = []
		if ( this.completed ) result.push("completed");
		if ( this.editing ) result.push("editing");
		return result;
	};

	// The TodoController is the controller for the main scope
	var TodoController = function(scope) {
		// Initialise the default state of the scope
		scope.todos = [];
		scope.newTodo = "";
		scope.filter = "all";

		// Restore the saved state
		var savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"todos":[]}');
		for ( var i = 0; i < savedState.todos.length; i++ ) {
			scope.todos.push(new Todo(savedState.todos[i]));
		}

		// Add value functions to the scope
		scope.filteredTodos = function() {
			if ( this.filter === "completed" ) {
				return this.completedItems();
			} else if ( this.filter === "active" ) {
				return this.activeItems();
			} else {
				return this.todos;
			}
		};
		
		scope.allTodosAreComplete = function(localScope, checked) {
			var result = this.completedItems().length === this.todos.length;
			if ( typeof checked === "undefined" ) {
				// Return true if all of the todos are complete
				return result;
			} else {
				// Set todos to be completed or not completed by toggling current "all complete" value
				var newState = !result;
				for ( var i = 0; i < this.todos.length; i++ ) {
					this.todos[i].completed = newState;
				}
				this.$.apply();
			}
		};
		
		scope.completedItems = function() {
			return $.grep(this.todos, function(todo, i) {
				return todo.completed;
			});
		};
		
		scope.activeItems = function() {
			return $.grep(this.todos, function(todo, i) {
				return !todo.completed;
			});
		};
	};

	TodoController.prototype.editTodoKeyPress = function(todo, e) {
		if (e.which === ENTER_KEY) {
			this.updateItem(todo);
		} else if (e.which === ESCAPE_KEY) {
			todo.$.apply(function() {
				this.editing = false;
				this.title = this.savedTitle;
			});
		}
	};
	
	TodoController.prototype.editItem = function(todo) {
		todo.$.apply(function() {
			this.editing = true;
			this.savedTitle = this.title;
		});
		
		$(todo.$.nodes()).find(".edit").focus();
	};
	
	TodoController.prototype.updateItem = function(todo) {
		var title = todo.title.trim();
		if ( title.length ) {
			todo.title = title;
			todo.savedTitle = title;
			todo.editing = false;
		} else {
			this.removeItem(todo);
		}
		
		this.$.apply();
	};

	TodoController.prototype.removeItem = function(todo) {
		this.$.get("todos").splice(todo.$.index,1);
		this.$.apply();
	};

	TodoController.prototype.addItem = function() {
		var scope = this.$.scope();
		var title = scope.newTodo.trim();
		if ( title.length ) {
			scope.todos.push(new Todo({title: title}));
			scope.newTodo = "";
			scope.$.apply();
		}
	};
	
	TodoController.prototype.newTodoKeyPress = function(localScope, e, dom) {
		if (e.which === ENTER_KEY) {
			this.$.fire("addItem");
		}
	};
	
	TodoController.prototype.removeCompleted = function() {
		var scope = this.$.scope();
		scope.todos = scope.activeItems();
		scope.$.apply();
	};

	TodoController.prototype.save = function() {
		var scope = this.$.scope();
		localStorage.setItem('todos-consistent.js', JSON.stringify({
			todos : scope.todos
		}));
	};

	// Initialise Consistent.js on the main DOM element
	var scope = $("#todoapp").consistent(TodoController);

	// Use the provided Flatiron Director for routing, since Consistent.js cares not one whit about routes.
	Router({
		'/:filter': function(filter) {
			scope.filter = filter;
			scope.$.apply();
		}
	}).init();	

	// Store the state each time the scope changes
	var debounceTimer;
	scope.$.watch(function(whichScope) {
		// Only listen to the main scope
		if (whichScope === scope) {
			if ( debounceTimer ) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(function(){
				scope.$.fire("save");
			}, 0);
		}
	});

	// Apply the initial scope
	scope.$.apply();

})();
