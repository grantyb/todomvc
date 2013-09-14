(function () {
	'use strict';

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	var LOCAL_STORAGE_KEY = 'todos-consistent.js';
	// Set up the Todo "class"
	var Todo = function(opts) {
		var todo = this;
		todo.title = opts.title;
		todo.editedTitle = opts.title;
		todo.completed = opts.completed || false;
		todo.editing = false;
	};
	Todo.prototype.modes = function() {
		var result = []
		if ( this.completed ) result.push("completed");
		if ( this.editing ) result.push("editing");
		console.log("Modes called for " + this.title,result);
		return result;
	};
	
	var scopeOptions = {
		"autoListenToKeyEvents": false
	};

	// Initialise Consistent.js on the main DOM element
	var scope = $("#todoapp").consistent(scopeOptions);
	
	// Set the default state
	scope.todos = [];
	scope.newTodo = "";
	scope.filter = scope.filter || "all"; // In case there was no filter specified in the route
	var savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"todos":[]}');
	for ( var i = 0; i < savedState.todos.length; i++ ) {
		scope.todos.push(new Todo(savedState.todos[i]));
	}
	
	scope.filteredTodos = function() {
		console.log("filteredTodos");
		if ( scope.filter === "completed" ) {
			return scope.completedItems();
		} else if ( scope.filter === "active" ) {
			return scope.activeItems();
		} else {
			return scope.todos;
		}
	};
	
	scope.allTodosAreComplete = function(checked) {
		console.log("allTodosAreComplete");
		var result = scope.completedItems().length === scope.todos.length;
		if ( typeof checked === "undefined" ) {
			return result;
		} else {
			var newState = !result;
			for ( var i = 0; i < scope.todos.length; i++ ) {
				scope.todos[i].completed = newState;
				scope.todos[i].$.apply();
			}
			scope.$.apply();
		}
	};
	
	scope.completedItems = function() {
		console.log("completedItems");
		return $.grep(scope.todos, function(todo, i) {
			return todo.completed;
		});
	};
	
	scope.activeItems = function() {
		console.log("activeItems");
		return $.grep(scope.todos, function(todo, i) {
			return !todo.completed;
		});
	};
	
	scope.$addItem = function() {
		console.log("$addItem");
		var title = scope.newTodo.trim();
		if ( title.length ) {
			scope.todos.push(new Todo({title: title}));
			scope.newTodo = "";
			scope.$.apply();
		}
	};
	
	scope.$editItem = function(e) {
		console.log("$editItem");
		this.editing = true;
		scope.$.apply();
		$(e.target).closest("li").find(".edit").focus();
	};
	
	scope.$updateItem = function() {
		console.log("$updateItem");
		var title = this.editedTitle.trim();
		if ( title.length ) {
			this.title = this.editedTitle;
			this.editing = false;
		} else {
			this.$removeItem();
		}
		scope.$.apply();
	};
	
	scope.$newTodoKeyPress = function(e) {
		console.log("$newTodoKeyPress");
		if (e.which === ENTER_KEY) {
			this.$addItem();
		}
	};
	
	scope.$editTodoKeyPress = function(e) {
		console.log("$editTodoKeyPress", e.which);
		if (e.which === ENTER_KEY) {
			this.$updateItem();
		} else if (e.which === ESCAPE_KEY) {
			this.editing = false;
			scope.$.apply();
		}
	};
	
	scope.$removeItem = function() {
		console.log("$removeItem");
		scope.todos.splice(this.$.index,1);
		this.$.apply();
	};

	scope.$removeCompleted = function() {
		console.log("$removeCompleted");
		scope.todos = scope.activeItems();
		scope.$.apply();
	};

	// Use the provided Flatiron Director for routing, since Consistent.js cares not one whit about routes.
	Router({
		'/:filter': function(filter) {
			console.log("router : " + filter);
			scope.filter = filter;
			scope.$.apply();
		}
	}).init();	

	// Store the state on unload
	$(window).bind("beforeunload", function() {
		localStorage.setItem('todos-consistent.js', JSON.stringify({
			todos : scope.todos
		}));
	});

	// Apply the initial scope
	scope.$.apply();

})();
