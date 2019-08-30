Object.defineProperty(exports, '__esModule', {
	value: true
});
/** @babel */

var getIconClass = function getIconClass(state) {
	return 'icon aec-icon-mouse text-' + (state || 'subtle');
};

var getIcon = function getIcon() {
	return document.getElementById('aec-status-bar-tile');
};

var getContainer = function getContainer() {
	return document.getElementById('aec-status-bar-container');
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
		getContainer().appendChild(icon);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2VkaXRvcmNvbmZpZy9saWIvc3RhdHVzdGlsZS12aWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBRUEsSUFBTSxZQUFZLEdBQUcsU0FBZixZQUFZLENBQUcsS0FBSyxFQUFJO0FBQzdCLHVDQUFtQyxLQUFLLElBQUksUUFBUSxDQUFBLENBQUc7Q0FDdkQsQ0FBQzs7QUFFRixJQUFNLE9BQU8sR0FBRyxTQUFWLE9BQU8sR0FBUztBQUNyQixRQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztDQUN0RCxDQUFDOztBQUVGLElBQU0sWUFBWSxHQUFHLFNBQWYsWUFBWSxHQUFTO0FBQzFCLFFBQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0NBQzNELENBQUM7O0FBRUYsSUFBTSxVQUFVLEdBQUcsU0FBYixVQUFVLENBQUcsS0FBSyxFQUFJO0FBQzNCLEtBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTVDLEtBQUksQ0FBQyxFQUFFLEdBQUcscUJBQXFCLENBQUM7QUFDaEMsS0FBSSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckMsS0FBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxZQUFNO0FBQ3BDLE1BQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0VBQ3RGLENBQUMsQ0FBQzs7QUFFSCxRQUFPLElBQUksQ0FBQztDQUNaLENBQUM7O0FBRUssSUFBTSxVQUFVLEdBQUcsU0FBYixVQUFVLEdBQVM7QUFDL0IsS0FBSSxPQUFPLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDdkIsU0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0VBQzVDO0NBQ0QsQ0FBQzs7O0FBRUssSUFBTSxlQUFlLEdBQUcsU0FBbEIsZUFBZSxHQUFTO0FBQ3BDLFFBQU8sWUFBWSxFQUFFLEtBQUssSUFBSSxDQUFDO0NBQy9CLENBQUM7OztBQUVGLElBQU0sV0FBVyxHQUFHLFNBQWQsV0FBVyxDQUFHLEtBQUssRUFBSTtBQUM1QixLQUFNLElBQUksR0FBRyxPQUFPLEVBQUUsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUMsS0FBSSxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksSUFBSSxlQUFlLEVBQUUsRUFBRTtBQUNsRCxjQUFZLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDakMsTUFBTTtBQUNOLE1BQUksQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3JDO0NBQ0QsQ0FBQzs7QUFFSyxJQUFNLFVBQVUsR0FBRyxTQUFiLFVBQVUsQ0FBRyxLQUFLLEVBQUk7QUFDbEMsS0FBSSxLQUFLLEtBQUssU0FBUyxJQUN0QixLQUFLLEtBQUssT0FBTyxFQUFFO0FBQ25CLGFBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUNuQixNQUFNO0FBQ04sWUFBVSxFQUFFLENBQUM7RUFDYjtDQUNELENBQUM7Ozs7O0FBSUssSUFBTSxlQUFlLEdBQUcsU0FBbEIsZUFBZSxHQUFTO0FBQ3BDLEtBQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRTFDLElBQUcsQ0FBQyxFQUFFLEdBQUcsMEJBQTBCLENBQUM7QUFDcEMsSUFBRyxDQUFDLFNBQVMsR0FBRyxjQUFjLENBQUM7O0FBRS9CLFFBQU8sR0FBRyxDQUFDO0NBQ1gsQ0FBQyIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9lZGl0b3Jjb25maWcvbGliL3N0YXR1c3RpbGUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuY29uc3QgZ2V0SWNvbkNsYXNzID0gc3RhdGUgPT4ge1xuXHRyZXR1cm4gYGljb24gYWVjLWljb24tbW91c2UgdGV4dC0ke3N0YXRlIHx8ICdzdWJ0bGUnfWA7XG59O1xuXG5jb25zdCBnZXRJY29uID0gKCkgPT4ge1xuXHRyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FlYy1zdGF0dXMtYmFyLXRpbGUnKTtcbn07XG5cbmNvbnN0IGdldENvbnRhaW5lciA9ICgpID0+IHtcblx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZWMtc3RhdHVzLWJhci1jb250YWluZXInKTtcbn07XG5cbmNvbnN0IGNyZWF0ZUljb24gPSBzdGF0ZSA9PiB7XG5cdGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cblx0aWNvbi5pZCA9ICdhZWMtc3RhdHVzLWJhci10aWxlJztcblx0aWNvbi5jbGFzc05hbWUgPSBnZXRJY29uQ2xhc3Moc3RhdGUpO1xuXHRpY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ0VkaXRvckNvbmZpZzpzaG93LXN0YXRlJyk7XG5cdH0pO1xuXG5cdHJldHVybiBpY29uO1xufTtcblxuZXhwb3J0IGNvbnN0IHJlbW92ZUljb24gPSAoKSA9PiB7XG5cdGlmIChnZXRJY29uKCkgIT09IG51bGwpIHtcblx0XHRnZXRJY29uKCkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChnZXRJY29uKCkpO1xuXHR9XG59O1xuXG5leHBvcnQgY29uc3QgY29udGFpbmVyRXhpc3RzID0gKCkgPT4ge1xuXHRyZXR1cm4gZ2V0Q29udGFpbmVyKCkgIT09IG51bGw7XG59O1xuXG5jb25zdCBkaXNwbGF5SWNvbiA9IHN0YXRlID0+IHtcblx0Y29uc3QgaWNvbiA9IGdldEljb24oKSB8fCBjcmVhdGVJY29uKHN0YXRlKTtcblx0aWYgKGljb24ucGFyZW50Tm9kZSA9PT0gbnVsbCAmJiBjb250YWluZXJFeGlzdHMoKSkge1xuXHRcdGdldENvbnRhaW5lcigpLmFwcGVuZENoaWxkKGljb24pO1xuXHR9IGVsc2Uge1xuXHRcdGljb24uY2xhc3NOYW1lID0gZ2V0SWNvbkNsYXNzKHN0YXRlKTtcblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IHVwZGF0ZUljb24gPSBzdGF0ZSA9PiB7XG5cdGlmIChzdGF0ZSA9PT0gJ3dhcm5pbmcnIHx8XG5cdFx0c3RhdGUgPT09ICdlcnJvcicpIHtcblx0XHRkaXNwbGF5SWNvbihzdGF0ZSk7XG5cdH0gZWxzZSB7XG5cdFx0cmVtb3ZlSWNvbigpO1xuXHR9XG59O1xuXG4vLyBUaGUgY29udGFpbmVyIHN0YXlzIGFzIHBsYWNlaG9sZGVyIGluIHRoZSBzdGF0dXNCYXIsXG4vLyB0aGUgaWNvbiBpcyB0aGVuIGFkZGVkIGFuZCByZW1vdmVkIGFzIG5lZWRlZFxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbnRhaW5lciA9ICgpID0+IHtcblx0Y29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0ZGl2LmlkID0gJ2FlYy1zdGF0dXMtYmFyLWNvbnRhaW5lcic7XG5cdGRpdi5jbGFzc05hbWUgPSAnaW5saW5lLWJsb2NrJztcblxuXHRyZXR1cm4gZGl2O1xufTtcbiJdfQ==