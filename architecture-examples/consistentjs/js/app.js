(function () {
	'use strict';

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	var LOCAL_STORAGE_KEY = 'todos-consistent.js';
	
	// Set up the Todo "class"
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
	
	Todo.prototype.$editTodoKeyPress = function(e) {
		if (e.which === ENTER_KEY) {
			this.$updateItem();
		} else if (e.which === ESCAPE_KEY) {
			this.editing = false;
			this.title = this.savedTitle;
			this.$.apply();
		}
	};
	
	Todo.prototype.$editItem = function() {
		this.editing = true;
		this.savedTitle = this.title;
		this.$.apply();
		$(this.$.nodes()).find(".edit").focus();
	};
	
	Todo.prototype.$updateItem = function() {
		var title = this.title.trim();
		if ( title.length ) {
			this.title = title;
			this.savedTitle = title;
			this.editing = false;
		} else {
			this.$removeItem();
		}
		this.$.apply();
	};

	Todo.prototype.$removeItem = function() {
		this.$.get("todos").splice(this.$.index,1);
		this.$.apply();
	};

	// Initialise Consistent.js on the main DOM element
	var scope = $("#todoapp").consistent();
	
	// Set the default state
	scope.todos = [];
	scope.newTodo = "";
	scope.filter = "all";
	var savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"todos":[]}');
	for ( var i = 0; i < savedState.todos.length; i++ ) {
		scope.todos.push(new Todo(savedState.todos[i]));
	}
	
	scope.filteredTodos = function() {
		if ( scope.filter === "completed" ) {
			return scope.completedItems();
		} else if ( scope.filter === "active" ) {
			return scope.activeItems();
		} else {
			return scope.todos;
		}
	};
	
	scope.allTodosAreComplete = function(checked) {
		var result = scope.completedItems().length === scope.todos.length;
		if ( typeof checked === "undefined" ) {
			return result;
		} else {
			var newState = !result;
			for ( var i = 0; i < scope.todos.length; i++ ) {
				scope.todos[i].completed = newState;
			}
			scope.$.apply();
		}
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
			scope.todos.push(new Todo({title: title}));
			scope.newTodo = "";
			scope.$.apply();
		}
	};
	
	scope.$newTodoKeyPress = function(e, dom) {
		if (e.which === ENTER_KEY) {
			scope.$addItem();
		}
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
	var debounceTimer;
	scope.$.watch(function() {
		if ( debounceTimer ) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(function(){
			localStorage.setItem('todos-consistent.js', JSON.stringify({
				todos : scope.todos
			}))
		}, 0);
	});

	// Apply the initial scope
	scope.$.apply();

})();
