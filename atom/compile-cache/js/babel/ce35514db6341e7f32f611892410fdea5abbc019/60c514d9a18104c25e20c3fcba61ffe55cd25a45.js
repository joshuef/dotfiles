Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _commandsGenerate = require('./commands/generate');

var _commandsGenerate2 = _interopRequireDefault(_commandsGenerate);

var _commandsShow = require('./commands/show');

var _commandsShow2 = _interopRequireDefault(_commandsShow);

var _commandsFix = require('./commands/fix');

var _commandsFix2 = _interopRequireDefault(_commandsFix);

var lazyReq = require('lazy-req')(require);

var atm = lazyReq('atom');

var checklist = lazyReq('./lib/checklist');
var wrapGuideInterceptor = lazyReq('./lib/wrapguide-interceptor');
var statusTile = lazyReq('./lib/statustile-view');
var editorconfig = lazyReq('editorconfig');

// Sets the state of the embedded editorconfig
// This includes the severity (info, warning..) as well as the notification-messages for users
function setState(ecfg) {
	checklist()(ecfg);
	statusTile().updateIcon(ecfg.state);
}

// Initializes the (into the TextBuffer-instance) embedded editorconfig-object
function initializeTextBuffer(buffer) {
	if ('editorconfig' in buffer === false) {
		buffer.editorconfig = {
			buffer: buffer, // preserving a reference to the parent TextBuffer
			disposables: new (atm().CompositeDisposable)(),
			state: 'subtle',
			settings: {
				trim_trailing_whitespace: 'auto', // eslint-disable-line camelcase
				insert_final_newline: 'auto', // eslint-disable-line camelcase
				max_line_length: 'auto', // eslint-disable-line camelcase
				end_of_line: 'auto', // eslint-disable-line camelcase
				indent_style: 'auto', // eslint-disable-line camelcase
				tab_width: 'auto', // eslint-disable-line camelcase
				charset: 'auto' // eslint-disable-line camelcase
			},

			// Get the current Editor for this.buffer
			getCurrentEditor: function getCurrentEditor() {
				var _this = this;

				return atom.workspace.getTextEditors().reduce(function (prev, curr) {
					return curr.getBuffer() === _this.buffer && curr || prev;
				}, undefined);
			},

			// Applies the settings to the buffer and the corresponding editor
			applySettings: function applySettings() {
				var editor = this.getCurrentEditor();
				if (!editor) {
					return;
				}
				var configOptions = { scope: editor.getRootScopeDescriptor() };
				var settings = this.settings;

				if (editor && editor.getBuffer() === buffer) {
					if (settings.indent_style === 'auto') {
						var usesSoftTabs = editor.usesSoftTabs();
						if (usesSoftTabs === undefined) {
							editor.setSoftTabs(atom.config.get('editor.softTabs', configOptions));
						} else {
							editor.setSoftTabs(usesSoftTabs);
						}
					} else {
						editor.setSoftTabs(settings.indent_style === 'space');
					}

					if (settings.tab_width === 'auto') {
						editor.setTabLength(atom.config.get('editor.tabLength', configOptions));
					} else {
						editor.setTabLength(settings.tab_width);
					}

					if (settings.charset === 'auto') {
						buffer.setEncoding(atom.config.get('core.fileEncoding', configOptions));
					} else {
						buffer.setEncoding(settings.charset);
					}

					// max_line_length-settings
					var editorParams = {};
					if (settings.max_line_length === 'auto') {
						editorParams.preferredLineLength = atom.config.get('editor.preferredLineLength', configOptions);
					} else {
						editorParams.preferredLineLength = settings.max_line_length;
					}

					// Update the editor-properties
					editor.update(editorParams);

					// Ensure the wrap-guide is being intercepted
					var bufferDom = atom.views.getView(editor);
					var wrapGuide = bufferDom.querySelector('* /deep/ .wrap-guide');
					if (wrapGuide !== null) {
						if (wrapGuide.editorconfig === undefined) {
							wrapGuide.editorconfig = this;
							wrapGuide.getNativeGuideColumn = wrapGuide.getGuideColumn;
							wrapGuide.getGuideColumn = wrapGuideInterceptor().getGuideColumn.bind(wrapGuide);
						}
						wrapGuide.updateGuide();
					}

					if (settings.end_of_line !== 'auto') {
						buffer.setPreferredLineEnding(settings.end_of_line);
					}
				}
				setState(this);
			},

			// onWillSave-Event-Handler
			// Trims whitespaces and inserts/strips final newline before saving
			onWillSave: function onWillSave() {
				var settings = this.settings;

				if (settings.trim_trailing_whitespace === true) {
					// eslint-disable-next-line max-params
					buffer.backwardsScan(/[ \t]+$/gm, function (params) {
						if (params.match[0].length > 0) {
							params.replace('');
						}
					});
				}

				if (settings.insert_final_newline !== 'auto') {
					var lastRow = buffer.getLineCount() - 1;

					if (buffer.isRowBlank(lastRow)) {
						var stripStart = buffer.previousNonBlankRow(lastRow);

						if (settings.insert_final_newline === true) {
							stripStart += 1;
						}
						// Strip empty lines from the end
						if (stripStart < lastRow) {
							buffer.deleteRows(stripStart + 1, lastRow);
						}
					} else if (settings.insert_final_newline === true) {
						buffer.append('\n');
					}
				}
			}
		};

		buffer.editorconfig.disposables.add(buffer.onWillSave(buffer.editorconfig.onWillSave.bind(buffer.editorconfig)));
		if (buffer.getUri() && buffer.getUri().match(/[\\|/]\.editorconfig$/g) !== null) {
			buffer.editorconfig.disposables.add(buffer.onDidSave(reapplyEditorconfig));
		}
	}
}

// Reveal and apply the editorconfig for the given TextEditor-instance
function observeTextEditor(editor) {
	if (!editor) {
		return;
	}
	initializeTextBuffer(editor.getBuffer());

	var file = editor.getURI();
	if (!file) {
		editor.onDidSave(function () {
			observeTextEditor(editor);
		});
		return;
	}

	editorconfig().parse(file).then(function (config) {
		if (Object.keys(config).length === 0) {
			return;
		}

		var ecfg = editor.getBuffer().editorconfig;
		var settings = ecfg.settings;
		var lineEndings = {
			crlf: '\r\n',
			cr: '\r',
			lf: '\n'
		};

		// Preserve evaluated Editorconfig
		ecfg.config = config;

		// Carefully normalize and initialize config-settings
		// eslint-disable-next-line camelcase
		settings.trim_trailing_whitespace = 'trim_trailing_whitespace' in config && typeof config.trim_trailing_whitespace === 'boolean' ? config.trim_trailing_whitespace === true : 'auto';

		// eslint-disable-next-line camelcase
		settings.insert_final_newline = 'insert_final_newline' in config && typeof config.insert_final_newline === 'boolean' ? config.insert_final_newline === true : 'auto';

		// eslint-disable-next-line camelcase
		settings.indent_style = 'indent_style' in config && config.indent_style.search(/^(space|tab)$/) > -1 ? config.indent_style : 'auto';

		// eslint-disable-next-line camelcase
		settings.end_of_line = lineEndings[config.end_of_line] || 'auto';

		// eslint-disable-next-line camelcase
		settings.tab_width = parseInt(config.indent_size || config.tab_width, 10);
		if (isNaN(settings.tab_width) || settings.tab_width <= 0) {
			settings.tab_width = 'auto'; // eslint-disable-line camelcase
		}

		// eslint-disable-next-line camelcase
		settings.max_line_length = parseInt(config.max_line_length, 10);
		if (isNaN(settings.max_line_length) || settings.max_line_length <= 0) {
			settings.max_line_length = 'auto'; // eslint-disable-line camelcase
		}

		settings.charset = 'charset' in config ? config.charset.replace(/-/g, '').toLowerCase() : 'auto';

		ecfg.applySettings();
	})['catch'](Error, function (e) {
		console.warn('atom-editorconfig: ' + e);
	});
}

// Reapplies the whole editorconfig to **all** open TextEditor-instances
function reapplyEditorconfig() {
	var textEditors = atom.workspace.getTextEditors();
	textEditors.forEach(function (editor) {
		observeTextEditor(editor);
	});
}

// Reapplies the settings immediately after changing the focus to a new pane
function observeActivePaneItem(editor) {
	if (editor && editor.constructor.name === 'TextEditor') {
		if (editor.getBuffer().editorconfig) {
			editor.getBuffer().editorconfig.applySettings();
		}
	} else {
		statusTile().removeIcon();
	}
}

// Hook into the events to recognize the user opening new editors or changing the pane
var activate = function activate() {
	(0, _commandsGenerate2['default'])();
	(0, _commandsShow2['default'])();
	(0, _commandsFix2['default'])();
	atom.workspace.observeTextEditors(observeTextEditor);
	atom.workspace.observeActivePaneItem(observeActivePaneItem);
	reapplyEditorconfig();
};

// Clean the status-icon up, remove all embedded editorconfig-objects
var deactivate = function deactivate() {
	var textEditors = atom.workspace.getTextEditors();
	textEditors.forEach(function (editor) {
		editor.getBuffer().editorconfig.disposables.dispose();
	});
	statusTile().removeIcon();
};

// Apply the statusbar icon-container
// The icon will be applied if needed
var consumeStatusBar = function consumeStatusBar(statusBar) {
	if (statusTile().containerExists() === false) {
		statusBar.addRightTile({
			item: statusTile().createContainer(),
			priority: 999
		});
	}
};

exports['default'] = { activate: activate, deactivate: deactivate, consumeStatusBar: consumeStatusBar };
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2VkaXRvcmNvbmZpZy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztnQ0FDMkIscUJBQXFCOzs7OzRCQUMxQixpQkFBaUI7Ozs7MkJBQ25CLGdCQUFnQjs7OztBQUVwQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTdDLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFNUIsSUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDN0MsSUFBTSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUNwRSxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNwRCxJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7Ozs7QUFJN0MsU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3ZCLFVBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xCLFdBQVUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDcEM7OztBQUdELFNBQVMsb0JBQW9CLENBQUMsTUFBTSxFQUFFO0FBQ3JDLEtBQUksY0FBYyxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7QUFDdkMsUUFBTSxDQUFDLFlBQVksR0FBRztBQUNyQixTQUFNLEVBQU4sTUFBTTtBQUNOLGNBQVcsRUFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUFBLEVBQUc7QUFDOUMsUUFBSyxFQUFFLFFBQVE7QUFDZixXQUFRLEVBQUU7QUFDVCw0QkFBd0IsRUFBRSxNQUFNO0FBQ2hDLHdCQUFvQixFQUFFLE1BQU07QUFDNUIsbUJBQWUsRUFBRSxNQUFNO0FBQ3ZCLGVBQVcsRUFBRSxNQUFNO0FBQ25CLGdCQUFZ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IjoiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuaW1wb3J0IGdlbmVyYXRlQ29uZmlnIGZyb20gJy4vY29tbWFuZHMvZ2VuZXJhdGUnO1xuaW1wb3J0IHNob3dTdGF0ZSBmcm9tICcuL2NvbW1hbmRzL3Nob3cnO1xuaW1wb3J0IGZpeEZpbGUgZnJvbSAnLi9jb21tYW5kcy9maXgnO1xuXG5jb25zdCBsYXp5UmVxID0gcmVxdWlyZSgnbGF6eS1yZXEnKShyZXF1aXJlKTtcblxuY29uc3QgYXRtID0gbGF6eVJlcSgnYXRvbScpO1xuXG5jb25zdCBjaGVja2xpc3QgPSBsYXp5UmVxKCcuL2xpYi9jaGVja2xpc3QnKTtcbmNvbnN0IHdyYXBHdWlkZUludGVyY2VwdG9yID0gbGF6eVJlcSgnLi9saWIvd3JhcGd1aWRlLWludGVyY2VwdG9yJyk7XG5jb25zdCBzdGF0dXNUaWxlID0gbGF6eVJlcSgnLi9saWIvc3RhdHVzdGlsZS12aWV3Jyk7XG5jb25zdCBlZGl0b3Jjb25maWcgPSBsYXp5UmVxKCdlZGl0b3Jjb25maWcnKTtcblxuLy8gU2V0cyB0aGUgc3RhdGUgb2YgdGhlIGVtYmVkZGVkIGVkaXRvcmNvbmZpZ1xuLy8gVGhpcyBpbmNsdWRlcyB0aGUgc2V2ZXJpdHkgKGluZm8sIHdhcm5pbmcuLikgYXMgd2VsbCBhcyB0aGUgbm90aWZpY2F0aW9uLW1lc3NhZ2VzIGZvciB1c2Vyc1xuZnVuY3Rpb24gc2V0U3RhdGUoZWNmZykge1xuXHRjaGVja2xpc3QoKShlY2ZnKTtcblx0c3RhdHVzVGlsZSgpLnVwZGF0ZUljb24oZWNmZy5zdGF0ZSk7XG59XG5cbi8vIEluaXRpYWxpemVzIHRoZSAoaW50byB0aGUgVGV4dEJ1ZmZlci1pbnN0YW5jZSkgZW1iZWRkZWQgZWRpdG9yY29uZmlnLW9iamVjdFxuZnVuY3Rpb24gaW5pdGlhbGl6ZVRleHRCdWZmZXIoYnVmZmVyKSB7XG5cdGlmICgnZWRpdG9yY29uZmlnJyBpbiBidWZmZXIgPT09IGZhbHNlKSB7XG5cdFx0YnVmZmVyLmVkaXRvcmNvbmZpZyA9IHtcblx0XHRcdGJ1ZmZlciwgLy8gcHJlc2VydmluZyBhIHJlZmVyZW5jZSB0byB0aGUgcGFyZW50IFRleHRCdWZmZXJcblx0XHRcdGRpc3Bvc2FibGVzOiBuZXcgKGF0bSgpLkNvbXBvc2l0ZURpc3Bvc2FibGUpKCksXG5cdFx0XHRzdGF0ZTogJ3N1YnRsZScsXG5cdFx0XHRzZXR0aW5nczoge1xuXHRcdFx0XHR0cmltX3RyYWlsaW5nX3doaXRlc3BhY2U6ICdhdXRvJywgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2Vcblx0XHRcdFx0aW5zZXJ0X2ZpbmFsX25ld2xpbmU6ICdhdXRvJywgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2Vcblx0XHRcdFx0bWF4X2xpbmVfbGVuZ3RoOiAnYXV0bycsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG5cdFx0XHRcdGVuZF9vZl9saW5lOiAnYXV0bycsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG5cdFx0XHRcdGluZGVudF9zdHlsZTogJ2F1dG8nLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbWVsY2FzZVxuXHRcdFx0XHR0YWJfd2lkdGg6ICdhdXRvJywgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2Vcblx0XHRcdFx0Y2hhcnNldDogJ2F1dG8nIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBHZXQgdGhlIGN1cnJlbnQgRWRpdG9yIGZvciB0aGlzLmJ1ZmZlclxuXHRcdFx0Z2V0Q3VycmVudEVkaXRvcigpIHtcblx0XHRcdFx0cmV0dXJuIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkucmVkdWNlKChwcmV2LCBjdXJyKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIChjdXJyLmdldEJ1ZmZlcigpID09PSB0aGlzLmJ1ZmZlciAmJiBjdXJyKSB8fCBwcmV2O1xuXHRcdFx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gQXBwbGllcyB0aGUgc2V0dGluZ3MgdG8gdGhlIGJ1ZmZlciBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgZWRpdG9yXG5cdFx0XHRhcHBseVNldHRpbmdzKCkge1xuXHRcdFx0XHRjb25zdCBlZGl0b3IgPSB0aGlzLmdldEN1cnJlbnRFZGl0b3IoKTtcblx0XHRcdFx0aWYgKCFlZGl0b3IpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgY29uZmlnT3B0aW9ucyA9IHtzY29wZTogZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKX07XG5cdFx0XHRcdGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncztcblxuXHRcdFx0XHRpZiAoZWRpdG9yICYmIGVkaXRvci5nZXRCdWZmZXIoKSA9PT0gYnVmZmVyKSB7XG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmluZGVudF9zdHlsZSA9PT0gJ2F1dG8nKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB1c2VzU29mdFRhYnMgPSBlZGl0b3IudXNlc1NvZnRUYWJzKCk7XG5cdFx0XHRcdFx0XHRpZiAodXNlc1NvZnRUYWJzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0ZWRpdG9yLnNldFNvZnRUYWJzKGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnNvZnRUYWJzJywgY29uZmlnT3B0aW9ucykpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZWRpdG9yLnNldFNvZnRUYWJzKHVzZXNTb2Z0VGFicyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVkaXRvci5zZXRTb2Z0VGFicyhzZXR0aW5ncy5pbmRlbnRfc3R5bGUgPT09ICdzcGFjZScpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy50YWJfd2lkdGggPT09ICdhdXRvJykge1xuXHRcdFx0XHRcdFx0ZWRpdG9yLnNldFRhYkxlbmd0aChhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci50YWJMZW5ndGgnLCBjb25maWdPcHRpb25zKSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVkaXRvci5zZXRUYWJMZW5ndGgoc2V0dGluZ3MudGFiX3dpZHRoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MuY2hhcnNldCA9PT0gJ2F1dG8nKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2V0RW5jb2RpbmcoYXRvbS5jb25maWcuZ2V0KCdjb3JlLmZpbGVFbmNvZGluZycsIGNvbmZpZ09wdGlvbnMpKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNldEVuY29kaW5nKHNldHRpbmdzLmNoYXJzZXQpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIG1heF9saW5lX2xlbmd0aC1zZXR0aW5nc1xuXHRcdFx0XHRcdGNvbnN0IGVkaXRvclBhcmFtcyA9IHt9O1xuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5tYXhfbGluZV9sZW5ndGggPT09ICdhdXRvJykge1xuXHRcdFx0XHRcdFx0ZWRpdG9yUGFyYW1zLnByZWZlcnJlZExpbmVMZW5ndGggPVxuXHRcdFx0XHRcdFx0XHRhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5wcmVmZXJyZWRMaW5lTGVuZ3RoJywgY29uZmlnT3B0aW9ucyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVkaXRvclBhcmFtcy5wcmVmZXJyZWRMaW5lTGVuZ3RoID0gc2V0dGluZ3MubWF4X2xpbmVfbGVuZ3RoO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFVwZGF0ZSB0aGUgZWRpdG9yLXByb3BlcnRpZXNcblx0XHRcdFx0XHRlZGl0b3IudXBkYXRlKGVkaXRvclBhcmFtcyk7XG5cblx0XHRcdFx0XHQvLyBFbnN1cmUgdGhlIHdyYXAtZ3VpZGUgaXMgYmVpbmcgaW50ZXJjZXB0ZWRcblx0XHRcdFx0XHRjb25zdCBidWZmZXJEb20gPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcblx0XHRcdFx0XHRjb25zdCB3cmFwR3VpZGUgPSBidWZmZXJEb20ucXVlcnlTZWxlY3RvcignKiAvZGVlcC8gLndyYXAtZ3VpZGUnKTtcblx0XHRcdFx0XHRpZiAod3JhcEd1aWRlICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRpZiAod3JhcEd1aWRlLmVkaXRvcmNvbmZpZyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdHdyYXBHdWlkZS5lZGl0b3Jjb25maWcgPSB0aGlzO1xuXHRcdFx0XHRcdFx0XHR3cmFwR3VpZGUuZ2V0TmF0aXZlR3VpZGVDb2x1bW4gPSB3cmFwR3VpZGUuZ2V0R3VpZGVDb2x1bW47XG5cdFx0XHRcdFx0XHRcdHdyYXBHdWlkZS5nZXRHdWlkZUNvbHVtbiA9IHdyYXBHdWlkZUludGVyY2VwdG9yKClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuZ2V0R3VpZGVDb2x1bW5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuYmluZCh3cmFwR3VpZGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0d3JhcEd1aWRlLnVwZGF0ZUd1aWRlKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmVuZF9vZl9saW5lICE9PSAnYXV0bycpIHtcblx0XHRcdFx0XHRcdGJ1ZmZlci5zZXRQcmVmZXJyZWRMaW5lRW5kaW5nKHNldHRpbmdzLmVuZF9vZl9saW5lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0c2V0U3RhdGUodGhpcyk7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBvbldpbGxTYXZlLUV2ZW50LUhhbmRsZXJcblx0XHRcdC8vIFRyaW1zIHdoaXRlc3BhY2VzIGFuZCBpbnNlcnRzL3N0cmlwcyBmaW5hbCBuZXdsaW5lIGJlZm9yZSBzYXZpbmdcblx0XHRcdG9uV2lsbFNhdmUoKSB7XG5cdFx0XHRcdGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncztcblxuXHRcdFx0XHRpZiAoc2V0dGluZ3MudHJpbV90cmFpbGluZ193aGl0ZXNwYWNlID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1wYXJhbXNcblx0XHRcdFx0XHRidWZmZXIuYmFja3dhcmRzU2NhbigvWyBcXHRdKyQvZ20sIHBhcmFtcyA9PiB7XG5cdFx0XHRcdFx0XHRpZiAocGFyYW1zLm1hdGNoWzBdLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdFx0cGFyYW1zLnJlcGxhY2UoJycpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHNldHRpbmdzLmluc2VydF9maW5hbF9uZXdsaW5lICE9PSAnYXV0bycpIHtcblx0XHRcdFx0XHRjb25zdCBsYXN0Um93ID0gYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcblxuXHRcdFx0XHRcdGlmIChidWZmZXIuaXNSb3dCbGFuayhsYXN0Um93KSkge1xuXHRcdFx0XHRcdFx0bGV0IHN0cmlwU3RhcnQgPSBidWZmZXIucHJldmlvdXNOb25CbGFua1JvdyhsYXN0Um93KTtcblxuXHRcdFx0XHRcdFx0aWYgKHNldHRpbmdzLmluc2VydF9maW5hbF9uZXdsaW5lID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRcdHN0cmlwU3RhcnQgKz0gMTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdC8vIFN0cmlwIGVtcHR5IGxpbmVzIGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdFx0aWYgKHN0cmlwU3RhcnQgPCBsYXN0Um93KSB7XG5cdFx0XHRcdFx0XHRcdGJ1ZmZlci5kZWxldGVSb3dzKHN0cmlwU3RhcnQgKyAxLCBsYXN0Um93KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHNldHRpbmdzLmluc2VydF9maW5hbF9uZXdsaW5lID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuYXBwZW5kKCdcXG4nKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0YnVmZmVyLmVkaXRvcmNvbmZpZy5kaXNwb3NhYmxlcy5hZGQoXG5cdFx0XHRidWZmZXIub25XaWxsU2F2ZShidWZmZXIuZWRpdG9yY29uZmlnLm9uV2lsbFNhdmUuYmluZChidWZmZXIuZWRpdG9yY29uZmlnKSlcblx0XHQpO1xuXHRcdGlmIChidWZmZXIuZ2V0VXJpKCkgJiYgYnVmZmVyLmdldFVyaSgpLm1hdGNoKC9bXFxcXHwvXVxcLmVkaXRvcmNvbmZpZyQvZykgIT09IG51bGwpIHtcblx0XHRcdGJ1ZmZlci5lZGl0b3Jjb25maWcuZGlzcG9zYWJsZXMuYWRkKFxuXHRcdFx0XHRidWZmZXIub25EaWRTYXZlKHJlYXBwbHlFZGl0b3Jjb25maWcpXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxufVxuXG4vLyBSZXZlYWwgYW5kIGFwcGx5IHRoZSBlZGl0b3Jjb25maWcgZm9yIHRoZSBnaXZlbiBUZXh0RWRpdG9yLWluc3RhbmNlXG5mdW5jdGlvbiBvYnNlcnZlVGV4dEVkaXRvcihlZGl0b3IpIHtcblx0aWYgKCFlZGl0b3IpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0aW5pdGlhbGl6ZVRleHRCdWZmZXIoZWRpdG9yLmdldEJ1ZmZlcigpKTtcblxuXHRjb25zdCBmaWxlID0gZWRpdG9yLmdldFVSSSgpO1xuXHRpZiAoIWZpbGUpIHtcblx0XHRlZGl0b3Iub25EaWRTYXZlKCgpID0+IHtcblx0XHRcdG9ic2VydmVUZXh0RWRpdG9yKGVkaXRvcik7XG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZWRpdG9yY29uZmlnKCkucGFyc2UoZmlsZSkudGhlbihjb25maWcgPT4ge1xuXHRcdGlmIChPYmplY3Qua2V5cyhjb25maWcpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGVjZmcgPSBlZGl0b3IuZ2V0QnVmZmVyKCkuZWRpdG9yY29uZmlnO1xuXHRcdGNvbnN0IHNldHRpbmdzID0gZWNmZy5zZXR0aW5ncztcblx0XHRjb25zdCBsaW5lRW5kaW5ncyA9IHtcblx0XHRcdGNybGY6ICdcXHJcXG4nLFxuXHRcdFx0Y3I6ICdcXHInLFxuXHRcdFx0bGY6ICdcXG4nXG5cdFx0fTtcblxuXHRcdC8vIFByZXNlcnZlIGV2YWx1YXRlZCBFZGl0b3Jjb25maWdcblx0XHRlY2ZnLmNvbmZpZyA9IGNvbmZpZztcblxuXHRcdC8vIENhcmVmdWxseSBub3JtYWxpemUgYW5kIGluaXRpYWxpemUgY29uZmlnLXNldHRpbmdzXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNhbWVsY2FzZVxuXHRcdHNldHRpbmdzLnRyaW1fdHJhaWxpbmdfd2hpdGVzcGFjZSA9ICgndHJpbV90cmFpbGluZ193aGl0ZXNwYWNlJyBpbiBjb25maWcpICYmXG5cdFx0XHR0eXBlb2YgY29uZmlnLnRyaW1fdHJhaWxpbmdfd2hpdGVzcGFjZSA9PT0gJ2Jvb2xlYW4nID9cblx0XHRcdGNvbmZpZy50cmltX3RyYWlsaW5nX3doaXRlc3BhY2UgPT09IHRydWUgOlxuXHRcdFx0J2F1dG8nO1xuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNhbWVsY2FzZVxuXHRcdHNldHRpbmdzLmluc2VydF9maW5hbF9uZXdsaW5lID0gKCdpbnNlcnRfZmluYWxfbmV3bGluZScgaW4gY29uZmlnKSAmJlxuXHRcdFx0dHlwZW9mIGNvbmZpZy5pbnNlcnRfZmluYWxfbmV3bGluZSA9PT0gJ2Jvb2xlYW4nID9cblx0XHRcdGNvbmZpZy5pbnNlcnRfZmluYWxfbmV3bGluZSA9PT0gdHJ1ZSA6XG5cdFx0XHQnYXV0byc7XG5cblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2FtZWxjYXNlXG5cdFx0c2V0dGluZ3MuaW5kZW50X3N0eWxlID0gKCgnaW5kZW50X3N0eWxlJyBpbiBjb25maWcpICYmXG5cdFx0XHRjb25maWcuaW5kZW50X3N0eWxlLnNlYXJjaCgvXihzcGFjZXx0YWIpJC8pID4gLTEpID9cblx0XHRcdGNvbmZpZy5pbmRlbnRfc3R5bGUgOlxuXHRcdFx0J2F1dG8nO1xuXG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNhbWVsY2FzZVxuXHRcdHNldHRpbmdzLmVuZF9vZl9saW5lID0gbGluZUVuZGluZ3NbY29uZmlnLmVuZF9vZl9saW5lXSB8fCAnYXV0byc7XG5cblx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2FtZWxjYXNlXG5cdFx0c2V0dGluZ3MudGFiX3dpZHRoID0gcGFyc2VJbnQoY29uZmlnLmluZGVudF9zaXplIHx8IGNvbmZpZy50YWJfd2lkdGgsIDEwKTtcblx0XHRpZiAoaXNOYU4oc2V0dGluZ3MudGFiX3dpZHRoKSB8fCBzZXR0aW5ncy50YWJfd2lkdGggPD0gMCkge1xuXHRcdFx0c2V0dGluZ3MudGFiX3dpZHRoID0gJ2F1dG8nOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbWVsY2FzZVxuXHRcdH1cblxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjYW1lbGNhc2Vcblx0XHRzZXR0aW5ncy5tYXhfbGluZV9sZW5ndGggPSBwYXJzZUludChjb25maWcubWF4X2xpbmVfbGVuZ3RoLCAxMCk7XG5cdFx0aWYgKGlzTmFOKHNldHRpbmdzLm1heF9saW5lX2xlbmd0aCkgfHwgc2V0dGluZ3MubWF4X2xpbmVfbGVuZ3RoIDw9IDApIHtcblx0XHRcdHNldHRpbmdzLm1heF9saW5lX2xlbmd0aCA9ICdhdXRvJzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2Vcblx0XHR9XG5cblx0XHRzZXR0aW5ncy5jaGFyc2V0ID0gKCdjaGFyc2V0JyBpbiBjb25maWcpID9cblx0XHRcdGNvbmZpZy5jaGFyc2V0LnJlcGxhY2UoLy0vZywgJycpLnRvTG93ZXJDYXNlKCkgOlxuXHRcdFx0J2F1dG8nO1xuXG5cdFx0ZWNmZy5hcHBseVNldHRpbmdzKCk7XG5cdH0pLmNhdGNoKEVycm9yLCBlID0+IHtcblx0XHRjb25zb2xlLndhcm4oYGF0b20tZWRpdG9yY29uZmlnOiAke2V9YCk7XG5cdH0pO1xufVxuXG4vLyBSZWFwcGxpZXMgdGhlIHdob2xlIGVkaXRvcmNvbmZpZyB0byAqKmFsbCoqIG9wZW4gVGV4dEVkaXRvci1pbnN0YW5jZXNcbmZ1bmN0aW9uIHJlYXBwbHlFZGl0b3Jjb25maWcoKSB7XG5cdGNvbnN0IHRleHRFZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKTtcblx0dGV4dEVkaXRvcnMuZm9yRWFjaChlZGl0b3IgPT4ge1xuXHRcdG9ic2VydmVUZXh0RWRpdG9yKGVkaXRvcik7XG5cdH0pO1xufVxuXG4vLyBSZWFwcGxpZXMgdGhlIHNldHRpbmdzIGltbWVkaWF0ZWx5IGFmdGVyIGNoYW5naW5nIHRoZSBmb2N1cyB0byBhIG5ldyBwYW5lXG5mdW5jdGlvbiBvYnNlcnZlQWN0aXZlUGFuZUl0ZW0oZWRpdG9yKSB7XG5cdGlmIChlZGl0b3IgJiYgZWRpdG9yLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdUZXh0RWRpdG9yJykge1xuXHRcdGlmIChlZGl0b3IuZ2V0QnVmZmVyKCkuZWRpdG9yY29uZmlnKSB7XG5cdFx0XHRlZGl0b3IuZ2V0QnVmZmVyKCkuZWRpdG9yY29uZmlnLmFwcGx5U2V0dGluZ3MoKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0c3RhdHVzVGlsZSgpLnJlbW92ZUljb24oKTtcblx0fVxufVxuXG4vLyBIb29rIGludG8gdGhlIGV2ZW50cyB0byByZWNvZ25pemUgdGhlIHVzZXIgb3BlbmluZyBuZXcgZWRpdG9ycyBvciBjaGFuZ2luZyB0aGUgcGFuZVxuY29uc3QgYWN0aXZhdGUgPSAoKSA9PiB7XG5cdGdlbmVyYXRlQ29uZmlnKCk7XG5cdHNob3dTdGF0ZSgpO1xuXHRmaXhGaWxlKCk7XG5cdGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyhvYnNlcnZlVGV4dEVkaXRvcik7XG5cdGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbShvYnNlcnZlQWN0aXZlUGFuZUl0ZW0pO1xuXHRyZWFwcGx5RWRpdG9yY29uZmlnKCk7XG59O1xuXG4vLyBDbGVhbiB0aGUgc3RhdHVzLWljb24gdXAsIHJlbW92ZSBhbGwgZW1iZWRkZWQgZWRpdG9yY29uZmlnLW9iamVjdHNcbmNvbnN0IGRlYWN0aXZhdGUgPSAoKSA9PiB7XG5cdGNvbnN0IHRleHRFZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKTtcblx0dGV4dEVkaXRvcnMuZm9yRWFjaChlZGl0b3IgPT4ge1xuXHRcdGVkaXRvci5nZXRCdWZmZXIoKS5lZGl0b3Jjb25maWcuZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuXHR9KTtcblx0c3RhdHVzVGlsZSgpLnJlbW92ZUljb24oKTtcbn07XG5cbi8vIEFwcGx5IHRoZSBzdGF0dXNiYXIgaWNvbi1jb250YWluZXJcbi8vIFRoZSBpY29uIHdpbGwgYmUgYXBwbGllZCBpZiBuZWVkZWRcbmNvbnN0IGNvbnN1bWVTdGF0dXNCYXIgPSBzdGF0dXNCYXIgPT4ge1xuXHRpZiAoc3RhdHVzVGlsZSgpLmNvbnRhaW5lckV4aXN0cygpID09PSBmYWxzZSkge1xuXHRcdHN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuXHRcdFx0aXRlbTogc3RhdHVzVGlsZSgpLmNyZWF0ZUNvbnRhaW5lcigpLFxuXHRcdFx0cHJpb3JpdHk6IDk5OVxuXHRcdH0pO1xuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCB7YWN0aXZhdGUsIGRlYWN0aXZhdGUsIGNvbnN1bWVTdGF0dXNCYXJ9O1xuIl19