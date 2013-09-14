(function () {
	'use strict';

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	var LOCAL_STORAGE_KEY = 'todos-consistent.js';
	
	var scope = $("#todoapp").consistent();
	// Set the default state
	scope.todos = [];
	scope.newTodo = "";
	scope.filter = scope.filter || "all"; // In case there was no filter specified in the route
	var savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{todos:[]}');
	scope.todos = savedState.todos;
	
	// Set up the Todo "class"
	var Todo = function(title, completed, editing) {
		this.title = title;
		this.editedTitle = title;
		this.completed = completed || false;
		this.editing = editing || false;
		this.modes = function() {
			var modes = []
			if ( this.completed ) modes.push("completed");
			if ( this.editing ) modes.push("editing");
			return modes.join(" ");
		};
	};
	
	scope.filteredTodos = function() {
		if ( scope.filter === "completed" ) {
			return scope.completedItems();
		} else if ( scope.filter === "active" ) {
			return scope.activeItems();
		} else {
			return scope.todos;
		}
	};
	
	scope.allTodosAreComplete = function() {
		return scope.completedItems.length === scope.todos.length;
	};
	
	scope.completedItems = function() {
		return $.grep(scope.todos, function(todo, i) {
			return todo.completed;
		});
	};
	
	scope.activeItems = function() {
		return $.grep(scope.todos, function(todo, i) {
			return !todo.completed;
		});
	};
	
	scope.$addItem = function() {
		var title = scope.newTodo.trim();
		if ( title.length ) {
			scope.todos.push(new Todo(title));
			scope.newTodo = "";
			scope.$.apply();
		}
	};
	
	scope.$updateItem = function() {
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
		if (e.which === ENTER_KEY) {
			this.$addItem();
		}
	};
	
	scope.$editTodoKeyPress = function(e) {
		if (e.which === ENTER_KEY) {
			this.$updateItem();
		} else if (e.which === ESCAPE_KEY) {
			this.editing = false;
			scope.$.apply();
		}
	};
	
	scope.$removeItem = function() {
		this.todos.splice(this.$.index,1);
		this.$.apply();
	};

	scope.$completedAllTodos = function() {
		var newState = !scope.allItemsAreComplete();
		console.log("Setting all completed to " + newState);
		for ( var i = 0; i < scope.todos.length; i++ ) {
			console.log("Setting item " + i);
			scope.todos[i].completed = newState;
		}
		scope.$.apply();
	};

	scope.$removeCompleted = function() {
		scope.todos = scope.activeItems();
		scope.$.apply();
	};

	// Use the provided Flatiron Director for routing, since Consistent.js cares not one whit about routes.
	Router({
		'/:filter': function(filter) {
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
