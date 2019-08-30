Object.defineProperty(exports, '__esModule', {
	value: true
});
/** @babel */

var getIconClass = function getIconClass(state) {
	return 'icon aec-icon-mouse text-' + (state || 'subtle');
};

var getIcon = function getIcon() {
	return document.querySelector('#aec-status-bar-tile');
};

var getContainer = function getContainer() {
	return document.querySelector('#aec-status-bar-container');
};

var createIcon = function createIcon(state) {
	var icon = document.createElement('span');

	icon.id = 'aec-status-bar-tile';
	icon.className = getIconClass(state);
	icon.addEventListener('click', function () {
		atom.commands.dispatch(atom.views.getView(atom.workspace), 'EditorConfig:show-state');
	});

	return icon;
};

var removeIcon = function removeIcon() {
	if (getIcon() !== null) {
		getIcon().parentNode.removeChild(getIcon());
	}
};

exports.removeIcon = removeIcon;
var containerExists = function containerExists() {
	return getContainer() !== null;
};

exports.containerExists = containerExists;
var displayIcon = function displayIcon(state) {
	var icon = getIcon() || createIcon(state);

	if (icon.parentNode === null && containerExists()) {
		getContainer().append(icon);
	} else {
		icon.className = getIconClass(state);
	}
};

var updateIcon = function updateIcon(state) {
	if (state === 'warning' || state === 'error') {
		displayIcon(state);
	} else {
		removeIcon();
	}
};

exports.updateIcon = updateIcon;
// The container stays as placeholder in the statusBar,
// the icon is then added and removed as needed
var createContainer = function createContainer() {
	var div = document.createElement('div');

	div.id = 'aec-status-bar-container';
	div.className = 'inline-block';

	return div;
};
exports.createContainer = createContainer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2xpYi9zdGF0dXN0aWxlLXZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFFQSxJQUFNLFlBQVksR0FBRyxTQUFmLFlBQVksQ0FBRyxLQUFLO3VDQUFnQyxLQUFLLElBQUksUUFBUSxDQUFBO0NBQUUsQ0FBQzs7QUFFOUUsSUFBTSxPQUFPLEdBQUcsU0FBVixPQUFPO1FBQVMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQztDQUFBLENBQUM7O0FBRXJFLElBQU0sWUFBWSxHQUFHLFNBQWYsWUFBWTtRQUFTLFFBQVEsQ0FBQyxhQUFhLENBQUMsMkJBQTJCLENBQUM7Q0FBQSxDQUFDOztBQUUvRSxJQUFNLFVBQVUsR0FBRyxTQUFiLFVBQVUsQ0FBRyxLQUFLLEVBQUk7QUFDM0IsS0FBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFNUMsS0FBSSxDQUFDLEVBQUUsR0FBRyxxQkFBcUIsQ0FBQztBQUNoQyxLQUFJLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQyxLQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQU07QUFDcEMsTUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLHlCQUF5QixDQUFDLENBQUM7RUFDdEYsQ0FBQyxDQUFDOztBQUVILFFBQU8sSUFBSSxDQUFDO0NBQ1osQ0FBQzs7QUFFSyxJQUFNLFVBQVUsR0FBRyxTQUFiLFVBQVUsR0FBUztBQUMvQixLQUFJLE9BQU8sRUFBRSxLQUFLLElBQUksRUFBRTtBQUN2QixTQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7RUFDNUM7Q0FDRCxDQUFDOzs7QUFFSyxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlO1FBQVMsWUFBWSxFQUFFLEtBQUssSUFBSTtDQUFBLENBQUM7OztBQUU3RCxJQUFNLFdBQVcsR0FBRyxTQUFkLFdBQVcsQ0FBRyxLQUFLLEVBQUk7QUFDNUIsS0FBTSxJQUFJLEdBQUcsT0FBTyxFQUFFLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUU1QyxLQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxJQUFJLGVBQWUsRUFBRSxFQUFFO0FBQ2xELGNBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUM1QixNQUFNO0FBQ04sTUFBSSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDckM7Q0FDRCxDQUFDOztBQUVLLElBQU0sVUFBVSxHQUFHLFNBQWIsVUFBVSxDQUFHLEtBQUssRUFBSTtBQUNsQyxLQUFJLEtBQUssS0FBSyxTQUFTLElBQ3RCLEtBQUssS0FBSyxPQUFPLEVBQUU7QUFDbkIsYUFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ25CLE1BQU07QUFDTixZQUFVLEVBQUUsQ0FBQztFQUNiO0NBQ0QsQ0FBQzs7Ozs7QUFJSyxJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLEdBQVM7QUFDcEMsS0FBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFMUMsSUFBRyxDQUFDLEVBQUUsR0FBRywwQkFBMEIsQ0FBQztBQUNwQyxJQUFHLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQzs7QUFFL0IsUUFBTyxHQUFHLENBQUM7Q0FDWCxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2xpYi9zdGF0dXN0aWxlLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmNvbnN0IGdldEljb25DbGFzcyA9IHN0YXRlID0+IGBpY29uIGFlYy1pY29uLW1vdXNlIHRleHQtJHtzdGF0ZSB8fCAnc3VidGxlJ31gO1xuXG5jb25zdCBnZXRJY29uID0gKCkgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FlYy1zdGF0dXMtYmFyLXRpbGUnKTtcblxuY29uc3QgZ2V0Q29udGFpbmVyID0gKCkgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FlYy1zdGF0dXMtYmFyLWNvbnRhaW5lcicpO1xuXG5jb25zdCBjcmVhdGVJY29uID0gc3RhdGUgPT4ge1xuXHRjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG5cdGljb24uaWQgPSAnYWVjLXN0YXR1cy1iYXItdGlsZSc7XG5cdGljb24uY2xhc3NOYW1lID0gZ2V0SWNvbkNsYXNzKHN0YXRlKTtcblx0aWNvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdFZGl0b3JDb25maWc6c2hvdy1zdGF0ZScpO1xuXHR9KTtcblxuXHRyZXR1cm4gaWNvbjtcbn07XG5cbmV4cG9ydCBjb25zdCByZW1vdmVJY29uID0gKCkgPT4ge1xuXHRpZiAoZ2V0SWNvbigpICE9PSBudWxsKSB7XG5cdFx0Z2V0SWNvbigpLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZ2V0SWNvbigpKTtcblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckV4aXN0cyA9ICgpID0+IGdldENvbnRhaW5lcigpICE9PSBudWxsO1xuXG5jb25zdCBkaXNwbGF5SWNvbiA9IHN0YXRlID0+IHtcblx0Y29uc3QgaWNvbiA9IGdldEljb24oKSB8fCBjcmVhdGVJY29uKHN0YXRlKTtcblxuXHRpZiAoaWNvbi5wYXJlbnROb2RlID09PSBudWxsICYmIGNvbnRhaW5lckV4aXN0cygpKSB7XG5cdFx0Z2V0Q29udGFpbmVyKCkuYXBwZW5kKGljb24pO1xuXHR9IGVsc2Uge1xuXHRcdGljb24uY2xhc3NOYW1lID0gZ2V0SWNvbkNsYXNzKHN0YXRlKTtcblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IHVwZGF0ZUljb24gPSBzdGF0ZSA9PiB7XG5cdGlmIChzdGF0ZSA9PT0gJ3dhcm5pbmcnIHx8XG5cdFx0c3RhdGUgPT09ICdlcnJvcicpIHtcblx0XHRkaXNwbGF5SWNvbihzdGF0ZSk7XG5cdH0gZWxzZSB7XG5cdFx0cmVtb3ZlSWNvbigpO1xuXHR9XG59O1xuXG4vLyBUaGUgY29udGFpbmVyIHN0YXlzIGFzIHBsYWNlaG9sZGVyIGluIHRoZSBzdGF0dXNCYXIsXG4vLyB0aGUgaWNvbiBpcyB0aGVuIGFkZGVkIGFuZCByZW1vdmVkIGFzIG5lZWRlZFxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbnRhaW5lciA9ICgpID0+IHtcblx0Y29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0ZGl2LmlkID0gJ2FlYy1zdGF0dXMtYmFyLWNvbnRhaW5lcic7XG5cdGRpdi5jbGFzc05hbWUgPSAnaW5saW5lLWJsb2NrJztcblxuXHRyZXR1cm4gZGl2O1xufTtcbiJdfQ==