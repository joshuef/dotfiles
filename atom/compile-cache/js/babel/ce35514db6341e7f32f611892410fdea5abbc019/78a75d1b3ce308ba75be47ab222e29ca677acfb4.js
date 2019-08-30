Object.defineProperty(exports, '__esModule', {
	value: true
});
/** @babel */

var _atom = require('atom');

var _libHelpers = require('../lib/helpers');

var notificationTemplate = function notificationTemplate() {
	var props = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	var output = '';

	// Format messages list
	if (Array.isArray(props.messages) && props.messages.length > 0) {
		output += props.messages.map(function (msg) {
			return msg.replace(/[\r\n]+/g, ' ').replace(/\s*@\s*/g, ' \n').replace(/^/, '1. ');
		}).join('\n');
	}

	// Format active configuration
	// This Markdown crap is temporary until I can replace it with real DOM generation
	output += '\n\n### Active Configuration\n\n| EditorConfig settings         |  Current values                     |\n|-------------------------------|------------------------------------:|\n| `charset`                     | `' + props.charset + '`                  |\n| `end_of_line`                 | `' + props.end_of_line + '`              |\n| `indent_size` / `tab_width`   | `' + props.tab_width + '`                |\n| `indent_style`                | `' + props.indent_style + '`             |\n| `insert_final_newline`        | `' + props.insert_final_newline + '`     |\n| `max_line_length`             | `' + props.max_line_length + '`          |\n| `trim_trailing_whitespace`    | `' + props.trim_trailing_whitespace + '` |\n\n<p></p>\n\n**Note:** `unset` means `atom-editorconfig` is not influencing a property\'s behaviour.\nA full description of all properties can be found on [editorconfig.org][1] or their\n[project\'s Wiki][2].\n\n[1]: https://editorconfig.org/#supported-properties\n[2]: https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties';
	return output.replace(/`/g, '`');
};

var init = function init() {
	var textEditor = atom.workspace.getActiveTextEditor();
	var ecfg = (0, _libHelpers.getConfigForEditor)(textEditor);
	if (ecfg) {
		var buffer = textEditor.getBuffer();
		var settings = ecfg.settings;
		var state = ecfg.state;

		var lineEndings = { '\n': '\\n', '\r': '\\r', '\r\n': '\\r\\n' };

		var properties = {
			filename: buffer.getUri(),
			messages: ecfg.messages,
			end_of_line: lineEndings[settings.end_of_line] || settings.end_of_line,
			charset: settings.charset,
			indent_style: settings.indent_style,
			tab_width: settings.tab_width,
			insert_final_newline: settings.insert_final_newline,
			trim_trailing_whitespace: settings.trim_trailing_whitespace,
			max_line_length: settings.max_line_length
		};

		var title = '<span class="aec-filename">' + textEditor.getTitle() + '</span>';
		var severity = state;
		var numIssues = properties.messages && properties.messages.length || 0;
		if (state === 'success' || !numIssues) {
			title = 'No problems affecting ' + title;
		} else if (state === 'warning' || state === 'error') {
			var plural = numIssues === 1 ? '' : 's';
			title = numIssues + ' problem' + plural + ' affecting ' + title;
		} else {
			severity = 'info';
			title = 'Status report for ' + title;
		}

		var notification = atom.notifications.addNotification(new _atom.Notification(severity, title, {
			description: notificationTemplate(properties),
			dismissable: true
		}));
		var popup = atom.views.getView(notification);
		popup.element.classList.add('aec-status-report');
	}
};

var subscriber = function subscriber() {
	atom.commands.add('atom-workspace', 'EditorConfig:show-state', init);
};

exports['default'] = subscriber;
exports.init = init;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2NvbW1hbmRzL3Nob3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7b0JBRTJCLE1BQU07OzBCQUNBLGdCQUFnQjs7QUFFakQsSUFBTSxvQkFBb0IsR0FBRyxTQUF2QixvQkFBb0IsR0FBbUI7S0FBZixLQUFLLHlEQUFHLEVBQUU7O0FBQ3ZDLEtBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQzs7O0FBR2hCLEtBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQy9ELFFBQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLEdBQUc7VUFBSSxHQUFHLENBQ3JDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQ3hCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQzFCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDO0dBQUEsQ0FDcEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDYjs7OztBQUlELE9BQU0sOE5BTThCLEtBQUssQ0FBQyxPQUFPLGlFQUNiLEtBQUssQ0FBQyxXQUFXLDZEQUNqQixLQUFLLENBQUMsU0FBUywrREFDZixLQUFLLENBQUMsWUFBWSw0REFDbEIsS0FBSyxDQUFDLG9CQUFvQixvREFDMUIsS0FBSyxDQUFDLGVBQWUseURBQ3JCLEtBQUssQ0FBQyx3QkFBd0IsaVdBU1ksQ0FBQztBQUMvRSxRQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQ2pDLENBQUM7O0FBRUYsSUFBTSxJQUFJLEdBQUcsU0FBUCxJQUFJLEdBQVM7QUFDbEIsS0FBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3hELEtBQU0sSUFBSSxHQUFHLG9DQUFtQixVQUFVLENBQUMsQ0FBQztBQUM1QyxLQUFJLElBQUksRUFBRTtBQUNULE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztNQUMvQixRQUFRLEdBQVcsSUFBSSxDQUF2QixRQUFRO01BQUUsS0FBSyxHQUFJLElBQUksQ0FBYixLQUFLOztBQUN0QixNQUFNLFdBQVcsR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFDLENBQUM7O0FBRWpFLE1BQU0sVUFBVSxHQUFHO0FBQ2xCLFdBQVEsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3pCLFdBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtBQUN2QixjQUFXLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxRQUFRLENBQUMsV0FBVztBQUN0RSxVQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU87QUFDekIsZUFBWSxFQUFFLFFBQVEsQ0FBQyxZQUFZO0FBQ25DLFlBQVMsRUFBRSxRQUFRLENBQUMsU0FBUztBQUM3Qix1QkFBb0IsRUFBRSxRQUFRLENBQUMsb0JBQW9CO0FBQ25ELDJCQUF3QixFQUFFLFFBQVEsQ0FBQyx3QkFBd0I7QUFDM0Qsa0JBQWUsRUFBRSxRQUFRLENBQUMsZUFBZTtHQUN6QyxDQUFDOztBQUVGLE1BQUksS0FBSyxtQ0FBaUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxZQUFTLENBQUM7QUFDekUsTUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLE1BQU0sU0FBUyxHQUFHLEFBQUMsVUFBVSxDQUFDLFFBQVEsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSyxDQUFDLENBQUM7QUFDM0UsTUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ3RDLFFBQUssOEJBQTRCLEtBQUssQUFBRSxDQUFDO0dBQ3pDLE1BQU0sSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxPQUFPLEVBQUU7QUFDcEQsT0FBTSxNQUFNLEdBQUcsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQzFDLFFBQUssR0FBTSxTQUFTLGdCQUFXLE1BQU0sbUJBQWMsS0FBSyxBQUFFLENBQUM7R0FDM0QsTUFBTTtBQUNOLFdBQVEsR0FBRyxNQUFNLENBQUM7QUFDbEIsUUFBSywwQkFBd0IsS0FBSyxBQUFFLENBQUM7R0FDckM7O0FBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQ3RELHVCQUFpQixRQUFRLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLGNBQVcsRUFBRSxvQkFBb0IsQ0FBQyxVQUFVLENBQUM7QUFDN0MsY0FBVyxFQUFFLElBQUk7R0FDakIsQ0FBQyxDQUNGLENBQUM7QUFDRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxPQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztFQUNqRDtDQUNELENBQUM7O0FBRUYsSUFBTSxVQUFVLEdBQUcsU0FBYixVQUFVLEdBQVM7QUFDeEIsS0FBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDckUsQ0FBQzs7cUJBRU0sVUFBVTtRQUFhLElBQUksR0FBSixJQUFJIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2NvbW1hbmRzL3Nob3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7Tm90aWZpY2F0aW9ufSBmcm9tICdhdG9tJztcbmltcG9ydCB7Z2V0Q29uZmlnRm9yRWRpdG9yfSBmcm9tICcuLi9saWIvaGVscGVycyc7XG5cbmNvbnN0IG5vdGlmaWNhdGlvblRlbXBsYXRlID0gKHByb3BzID0ge30pID0+IHtcblx0bGV0IG91dHB1dCA9ICcnO1xuXG5cdC8vIEZvcm1hdCBtZXNzYWdlcyBsaXN0XG5cdGlmIChBcnJheS5pc0FycmF5KHByb3BzLm1lc3NhZ2VzKSAmJiBwcm9wcy5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG5cdFx0b3V0cHV0ICs9IHByb3BzLm1lc3NhZ2VzLm1hcChtc2cgPT4gbXNnXG5cdFx0XHQucmVwbGFjZSgvW1xcclxcbl0rL2csICcgJylcblx0XHRcdC5yZXBsYWNlKC9cXHMqQFxccyovZywgJyBcXG4nKVxuXHRcdFx0LnJlcGxhY2UoL14vLCAnMS4gJylcblx0XHQpLmpvaW4oJ1xcbicpO1xuXHR9XG5cblx0Ly8gRm9ybWF0IGFjdGl2ZSBjb25maWd1cmF0aW9uXG5cdC8vIFRoaXMgTWFya2Rvd24gY3JhcCBpcyB0ZW1wb3JhcnkgdW50aWwgSSBjYW4gcmVwbGFjZSBpdCB3aXRoIHJlYWwgRE9NIGdlbmVyYXRpb25cblx0b3V0cHV0ICs9IGBcblxuIyMjIEFjdGl2ZSBDb25maWd1cmF0aW9uXG5cbnwgRWRpdG9yQ29uZmlnIHNldHRpbmdzICAgICAgICAgfCAgQ3VycmVudCB2YWx1ZXMgICAgICAgICAgICAgICAgICAgICB8XG58LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS06fFxufCDhv69jaGFyc2V04b+vICAgICAgICAgICAgICAgICAgICAgfCDhv68ke3Byb3BzLmNoYXJzZXR94b+vICAgICAgICAgICAgICAgICAgfFxufCDhv69lbmRfb2ZfbGluZeG/ryAgICAgICAgICAgICAgICAgfCDhv68ke3Byb3BzLmVuZF9vZl9saW5lfeG/ryAgICAgICAgICAgICAgfFxufCDhv69pbmRlbnRfc2l6ZeG/ryAvIOG/r3RhYl93aWR0aOG/ryAgIHwg4b+vJHtwcm9wcy50YWJfd2lkdGh94b+vICAgICAgICAgICAgICAgIHxcbnwg4b+vaW5kZW50X3N0eWxl4b+vICAgICAgICAgICAgICAgIHwg4b+vJHtwcm9wcy5pbmRlbnRfc3R5bGV94b+vICAgICAgICAgICAgIHxcbnwg4b+vaW5zZXJ0X2ZpbmFsX25ld2xpbmXhv68gICAgICAgIHwg4b+vJHtwcm9wcy5pbnNlcnRfZmluYWxfbmV3bGluZX3hv68gICAgIHxcbnwg4b+vbWF4X2xpbmVfbGVuZ3Ro4b+vICAgICAgICAgICAgIHwg4b+vJHtwcm9wcy5tYXhfbGluZV9sZW5ndGh94b+vICAgICAgICAgIHxcbnwg4b+vdHJpbV90cmFpbGluZ193aGl0ZXNwYWNl4b+vICAgIHwg4b+vJHtwcm9wcy50cmltX3RyYWlsaW5nX3doaXRlc3BhY2V94b+vIHxcblxuPHA+PC9wPlxuXG4qKk5vdGU6Kiog4b+vdW5zZXThv68gbWVhbnMg4b+vYXRvbS1lZGl0b3Jjb25maWfhv68gaXMgbm90IGluZmx1ZW5jaW5nIGEgcHJvcGVydHkncyBiZWhhdmlvdXIuXG5BIGZ1bGwgZGVzY3JpcHRpb24gb2YgYWxsIHByb3BlcnRpZXMgY2FuIGJlIGZvdW5kIG9uIFtlZGl0b3Jjb25maWcub3JnXVsxXSBvciB0aGVpclxuW3Byb2plY3QncyBXaWtpXVsyXS5cblxuWzFdOiBodHRwczovL2VkaXRvcmNvbmZpZy5vcmcvI3N1cHBvcnRlZC1wcm9wZXJ0aWVzXG5bMl06IGh0dHBzOi8vZ2l0aHViLmNvbS9lZGl0b3Jjb25maWcvZWRpdG9yY29uZmlnL3dpa2kvRWRpdG9yQ29uZmlnLVByb3BlcnRpZXNgO1xuXHRyZXR1cm4gb3V0cHV0LnJlcGxhY2UoL+G/ry9nLCAnYCcpO1xufTtcblxuY29uc3QgaW5pdCA9ICgpID0+IHtcblx0Y29uc3QgdGV4dEVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcblx0Y29uc3QgZWNmZyA9IGdldENvbmZpZ0ZvckVkaXRvcih0ZXh0RWRpdG9yKTtcblx0aWYgKGVjZmcpIHtcblx0XHRjb25zdCBidWZmZXIgPSB0ZXh0RWRpdG9yLmdldEJ1ZmZlcigpO1xuXHRcdGNvbnN0IHtzZXR0aW5ncywgc3RhdGV9ID0gZWNmZztcblx0XHRjb25zdCBsaW5lRW5kaW5ncyA9IHsnXFxuJzogJ1xcXFxuJywgJ1xccic6ICdcXFxccicsICdcXHJcXG4nOiAnXFxcXHJcXFxcbid9O1xuXG5cdFx0Y29uc3QgcHJvcGVydGllcyA9IHtcblx0XHRcdGZpbGVuYW1lOiBidWZmZXIuZ2V0VXJpKCksXG5cdFx0XHRtZXNzYWdlczogZWNmZy5tZXNzYWdlcyxcblx0XHRcdGVuZF9vZl9saW5lOiBsaW5lRW5kaW5nc1tzZXR0aW5ncy5lbmRfb2ZfbGluZV0gfHwgc2V0dGluZ3MuZW5kX29mX2xpbmUsXG5cdFx0XHRjaGFyc2V0OiBzZXR0aW5ncy5jaGFyc2V0LFxuXHRcdFx0aW5kZW50X3N0eWxlOiBzZXR0aW5ncy5pbmRlbnRfc3R5bGUsXG5cdFx0XHR0YWJfd2lkdGg6IHNldHRpbmdzLnRhYl93aWR0aCxcblx0XHRcdGluc2VydF9maW5hbF9uZXdsaW5lOiBzZXR0aW5ncy5pbnNlcnRfZmluYWxfbmV3bGluZSxcblx0XHRcdHRyaW1fdHJhaWxpbmdfd2hpdGVzcGFjZTogc2V0dGluZ3MudHJpbV90cmFpbGluZ193aGl0ZXNwYWNlLFxuXHRcdFx0bWF4X2xpbmVfbGVuZ3RoOiBzZXR0aW5ncy5tYXhfbGluZV9sZW5ndGhcblx0XHR9O1xuXG5cdFx0bGV0IHRpdGxlID0gYDxzcGFuIGNsYXNzPVwiYWVjLWZpbGVuYW1lXCI+JHt0ZXh0RWRpdG9yLmdldFRpdGxlKCl9PC9zcGFuPmA7XG5cdFx0bGV0IHNldmVyaXR5ID0gc3RhdGU7XG5cdFx0Y29uc3QgbnVtSXNzdWVzID0gKHByb3BlcnRpZXMubWVzc2FnZXMgJiYgcHJvcGVydGllcy5tZXNzYWdlcy5sZW5ndGgpIHx8IDA7XG5cdFx0aWYgKHN0YXRlID09PSAnc3VjY2VzcycgfHwgIW51bUlzc3Vlcykge1xuXHRcdFx0dGl0bGUgPSBgTm8gcHJvYmxlbXMgYWZmZWN0aW5nICR7dGl0bGV9YDtcblx0XHR9IGVsc2UgaWYgKHN0YXRlID09PSAnd2FybmluZycgfHwgc3RhdGUgPT09ICdlcnJvcicpIHtcblx0XHRcdGNvbnN0IHBsdXJhbCA9IG51bUlzc3VlcyA9PT0gMSA/ICcnIDogJ3MnO1xuXHRcdFx0dGl0bGUgPSBgJHtudW1Jc3N1ZXN9IHByb2JsZW0ke3BsdXJhbH0gYWZmZWN0aW5nICR7dGl0bGV9YDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2V2ZXJpdHkgPSAnaW5mbyc7XG5cdFx0XHR0aXRsZSA9IGBTdGF0dXMgcmVwb3J0IGZvciAke3RpdGxlfWA7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZE5vdGlmaWNhdGlvbihcblx0XHRcdG5ldyBOb3RpZmljYXRpb24oc2V2ZXJpdHksIHRpdGxlLCB7XG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBub3RpZmljYXRpb25UZW1wbGF0ZShwcm9wZXJ0aWVzKSxcblx0XHRcdFx0ZGlzbWlzc2FibGU6IHRydWVcblx0XHRcdH0pXG5cdFx0KTtcblx0XHRjb25zdCBwb3B1cCA9IGF0b20udmlld3MuZ2V0Vmlldyhub3RpZmljYXRpb24pO1xuXHRcdHBvcHVwLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYWVjLXN0YXR1cy1yZXBvcnQnKTtcblx0fVxufTtcblxuY29uc3Qgc3Vic2NyaWJlciA9ICgpID0+IHtcblx0YXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ0VkaXRvckNvbmZpZzpzaG93LXN0YXRlJywgaW5pdCk7XG59O1xuXG5leHBvcnQge3N1YnNjcmliZXIgYXMgZGVmYXVsdCwgaW5pdH07XG4iXX0=