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

var importLazy = require('import-lazy').proxy(require);

var atm = importLazy('atom');

var checklist = importLazy('./lib/checklist');
var wrapGuideInterceptor = importLazy('./lib/wrapguide-interceptor');
var statusTile = importLazy('./lib/statustile-view');
var editorconfig = importLazy('editorconfig');

// Sets the state of the embedded editorconfig
// This includes the severity (info, warning..) as well as the notification-messages for users
function setState(ecfg) {
	checklist(ecfg);
	statusTile.updateIcon(ecfg.state);
}

// Initializes the (into the TextBuffer-instance) embedded editorconfig-object
function initializeTextBuffer(buffer) {
	if ('editorconfig' in buffer === false) {
		buffer.editorconfig = {
			buffer: buffer, // Preserving a reference to the parent `TextBuffer`
			disposables: new atm.CompositeDisposable(),
			state: 'subtle',
			settings: {
				/* eslint-disable camelcase */
				trim_trailing_whitespace: 'unset',
				insert_final_newline: 'unset',
				max_line_length: 'unset',
				end_of_line: 'unset',
				indent_style: 'unset',
				tab_width: 'unset',
				charset: 'unset'
				/* eslint-enable camelcase */
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
					if (settings.indent_style === 'unset') {
						var usesSoftTabs = editor.usesSoftTabs();
						if (usesSoftTabs === undefined) {
							editor.setSoftTabs(atom.config.get('editor.softTabs', configOptions));
						} else {
							editor.setSoftTabs(usesSoftTabs);
						}
					} else {
						editor.setSoftTabs(settings.indent_style === 'space');
					}

					if (settings.tab_width === 'unset') {
						editor.setTabLength(atom.config.get('editor.tabLength', configOptions));
					} else {
						editor.setTabLength(settings.tab_width);
					}

					if (settings.charset === 'unset') {
						buffer.setEncoding(atom.config.get('core.fileEncoding', configOptions));
					} else {
						buffer.setEncoding(settings.charset);
					}

					// Max_line_length-settings
					var editorParams = {};
					if (settings.max_line_length === 'unset') {
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
							wrapGuide.getGuideColumn = wrapGuideInterceptor.getGuideColumn.bind(wrapGuide);
							wrapGuide.getNativeGuidesColumns = wrapGuide.getGuidesColumns;
							wrapGuide.getGuidesColumns = wrapGuideInterceptor.getGuidesColumns.bind(wrapGuide);
						}

						if (typeof wrapGuide.updateGuide === 'function') {
							wrapGuide.updateGuide();
						} else {
							// NB: This won't work with multiple wrap-guides
							var columnWidth = bufferDom.getDefaultCharacterWidth() * editorParams.preferredLineLength;
							if (columnWidth > 0) {
								wrapGuide.style.left = Math.round(columnWidth) + 'px';
								wrapGuide.style.display = 'block';
							} else {
								wrapGuide.style.display = 'none';
							}
						}
					}

					if (settings.end_of_line !== 'unset') {
						buffer.setPreferredLineEnding(settings.end_of_line);
					}
				}

				setState(this);
			},

			// `onWillSave` event handler
			// Trims whitespaces and inserts/strips final newline before saving
			onWillSave: function onWillSave() {
				var settings = this.settings;

				if (settings.trim_trailing_whitespace === true) {
					buffer.backwardsScan(/[ \t]+$/gm, function (params) {
						if (params.match[0].length > 0) {
							params.replace('');
						}
					});
				}

				if (settings.insert_final_newline !== 'unset') {
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

	editorconfig.parse(file).then(function (config) {
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

		/* eslint-disable camelcase */

		// Carefully normalize and initialize config-settings
		settings.trim_trailing_whitespace = 'trim_trailing_whitespace' in config && typeof config.trim_trailing_whitespace === 'boolean' ? config.trim_trailing_whitespace === true : 'unset';

		settings.insert_final_newline = 'insert_final_newline' in config && typeof config.insert_final_newline === 'boolean' ? config.insert_final_newline === true : 'unset';

		settings.indent_style = 'indent_style' in config && config.indent_style.search(/^(space|tab)$/) > -1 ? config.indent_style : 'unset';

		settings.end_of_line = lineEndings[config.end_of_line] || 'unset';

		settings.tab_width = parseInt(config.indent_size || config.tab_width, 10);
		if (isNaN(settings.tab_width) || settings.tab_width <= 0) {
			settings.tab_width = 'unset';
		}

		settings.max_line_length = parseInt(config.max_line_length, 10);
		if (isNaN(settings.max_line_length) || settings.max_line_length <= 0) {
			settings.max_line_length = 'unset';
		}

		settings.charset = 'charset' in config ? config.charset.replace(/-/g, '').toLowerCase() : 'unset';

		// #227: Allow `latin1` as an alias of ISO 8859-1.
		if (String(settings.charset).toLowerCase().replace(/\W/g, '') === 'latin1') {
			settings.charset = 'iso88591';
		}

		/* eslint-enable camelcase */

		ecfg.applySettings();
	})['catch'](function (error) {
		console.warn('atom-editorconfig: ' + error);
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
		if (editor.buffer && editor.buffer.editorconfig) {
			editor.buffer.editorconfig.applySettings();
		}
	} else {
		statusTile.removeIcon();
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

	// #220: Fix spurious "thrashing" in open editors at startup
	if (!atom.packages.hasActivatedInitialPackages()) {
		(function () {
			var disposables = new atm.CompositeDisposable();
			disposables.add(atom.packages.onDidActivatePackage(function (pkg) {
				if (pkg.name === 'whitespace' || pkg.name === 'wrap-guide') {
					reapplyEditorconfig();
				}
			}), atom.packages.onDidActivateInitialPackages(function () {
				disposables.dispose();
				reapplyEditorconfig();
			}));
		})();
	}
};

// Clean the status-icon up, remove all embedded editorconfig-objects
var deactivate = function deactivate() {
	var textEditors = atom.workspace.getTextEditors();
	textEditors.forEach(function (editor) {
		editor.getBuffer().editorconfig.disposables.dispose();
	});
	statusTile.removeIcon();
};

// Apply the statusbar icon-container
// The icon will be applied if needed
var consumeStatusBar = function consumeStatusBar(statusBar) {
	if (statusTile.containerExists() === false) {
		statusBar.addRightTile({
			item: statusTile.createContainer(),
			priority: 999
		});
	}
};

exports['default'] = { activate: activate, deactivate: deactivate, consumeStatusBar: consumeStatusBar };
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O2dDQUMyQixxQkFBcUI7Ozs7NEJBQzFCLGlCQUFpQjs7OzsyQkFDbkIsZ0JBQWdCOzs7O0FBRXBDLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRXpELElBQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFL0IsSUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDaEQsSUFBTSxvQkFBb0IsR0FBRyxVQUFVLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUN2RSxJQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUN2RCxJQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUM7Ozs7QUFJaEQsU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3ZCLFVBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQixXQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNsQzs7O0FBR0QsU0FBUyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7QUFDckMsS0FBSSxjQUFjLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtBQUN2QyxRQUFNLENBQUMsWUFBWSxHQUFHO0FBQ3JCLFNBQU0sRUFBTixNQUFNO0FBQ04sY0FBVyxFQUFFLElBQUssR0FBRyxDQUFDLG1CQUFtQixFQUFHO0FBQzVDLFFBQUssRUFBRSxRQUFRO0FBQ2YsV0FBUSxFQUFFOztBQUVULDRCQUF3QixFQUFFLE9BQU87QUFDakMsd0JBQW9CLEVBQUUsT0FBTztBQUM3QixtQkFBZSxFQUFFLE9BQU87QUFDeEIsZUFBVyxFQUFFLE9BQU87QUFDcEIsZ0JBQVks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Q0QsQ0FBQzs7cUJBRWEsRUFBQyxRQUFRLEVBQVIsUUFBUSxFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUUsZ0JBQWdCLEVBQWhCLGdCQUFnQixFQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvZWRpdG9yY29uZmlnL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuaW1wb3J0IGdlbmVyYXRlQ29uZmlnIGZyb20gJy4vY29tbWFuZHMvZ2VuZXJhdGUnO1xuaW1wb3J0IHNob3dTdGF0ZSBmcm9tICcuL2NvbW1hbmRzL3Nob3cnO1xuaW1wb3J0IGZpeEZpbGUgZnJvbSAnLi9jb21tYW5kcy9maXgnO1xuXG5jb25zdCBpbXBvcnRMYXp5ID0gcmVxdWlyZSgnaW1wb3J0LWxhenknKS5wcm94eShyZXF1aXJlKTtcblxuY29uc3QgYXRtID0gaW1wb3J0TGF6eSgnYXRvbScpO1xuXG5jb25zdCBjaGVja2xpc3QgPSBpbXBvcnRMYXp5KCcuL2xpYi9jaGVja2xpc3QnKTtcbmNvbnN0IHdyYXBHdWlkZUludGVyY2VwdG9yID0gaW1wb3J0TGF6eSgnLi9saWIvd3JhcGd1aWRlLWludGVyY2VwdG9yJyk7XG5jb25zdCBzdGF0dXNUaWxlID0gaW1wb3J0TGF6eSgnLi9saWIvc3RhdHVzdGlsZS12aWV3Jyk7XG5jb25zdCBlZGl0b3Jjb25maWcgPSBpbXBvcnRMYXp5KCdlZGl0b3Jjb25maWcnKTtcblxuLy8gU2V0cyB0aGUgc3RhdGUgb2YgdGhlIGVtYmVkZGVkIGVkaXRvcmNvbmZpZ1xuLy8gVGhpcyBpbmNsdWRlcyB0aGUgc2V2ZXJpdHkgKGluZm8sIHdhcm5pbmcuLikgYXMgd2VsbCBhcyB0aGUgbm90aWZpY2F0aW9uLW1lc3NhZ2VzIGZvciB1c2Vyc1xuZnVuY3Rpb24gc2V0U3RhdGUoZWNmZykge1xuXHRjaGVja2xpc3QoZWNmZyk7XG5cdHN0YXR1c1RpbGUudXBkYXRlSWNvbihlY2ZnLnN0YXRlKTtcbn1cblxuLy8gSW5pdGlhbGl6ZXMgdGhlIChpbnRvIHRoZSBUZXh0QnVmZmVyLWluc3RhbmNlKSBlbWJlZGRlZCBlZGl0b3Jjb25maWctb2JqZWN0XG5mdW5jdGlvbiBpbml0aWFsaXplVGV4dEJ1ZmZlcihidWZmZXIpIHtcblx0aWYgKCdlZGl0b3Jjb25maWcnIGluIGJ1ZmZlciA9PT0gZmFsc2UpIHtcblx0XHRidWZmZXIuZWRpdG9yY29uZmlnID0ge1xuXHRcdFx0YnVmZmVyLCAvLyBQcmVzZXJ2aW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBwYXJlbnQgYFRleHRCdWZmZXJgXG5cdFx0XHRkaXNwb3NhYmxlczogbmV3IChhdG0uQ29tcG9zaXRlRGlzcG9zYWJsZSkoKSxcblx0XHRcdHN0YXRlOiAnc3VidGxlJyxcblx0XHRcdHNldHRpbmdzOiB7XG5cdFx0XHRcdC8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuXHRcdFx0XHR0cmltX3RyYWlsaW5nX3doaXRlc3BhY2U6ICd1bnNldCcsXG5cdFx0XHRcdGluc2VydF9maW5hbF9uZXdsaW5lOiAndW5zZXQnLFxuXHRcdFx0XHRtYXhfbGluZV9sZW5ndGg6ICd1bnNldCcsXG5cdFx0XHRcdGVuZF9vZl9saW5lOiAndW5zZXQnLFxuXHRcdFx0XHRpbmRlbnRfc3R5bGU6ICd1bnNldCcsXG5cdFx0XHRcdHRhYl93aWR0aDogJ3Vuc2V0Jyxcblx0XHRcdFx0Y2hhcnNldDogJ3Vuc2V0J1xuXHRcdFx0XHQvKiBlc2xpbnQtZW5hYmxlIGNhbWVsY2FzZSAqL1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gR2V0IHRoZSBjdXJyZW50IEVkaXRvciBmb3IgdGhpcy5idWZmZXJcblx0XHRcdGdldEN1cnJlbnRFZGl0b3IoKSB7XG5cdFx0XHRcdHJldHVybiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpLnJlZHVjZSgocHJldiwgY3VycikgPT4ge1xuXHRcdFx0XHRcdHJldHVybiAoY3Vyci5nZXRCdWZmZXIoKSA9PT0gdGhpcy5idWZmZXIgJiYgY3VycikgfHwgcHJldjtcblx0XHRcdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRcdH0sXG5cblx0XHRcdC8vIEFwcGxpZXMgdGhlIHNldHRpbmdzIHRvIHRoZSBidWZmZXIgYW5kIHRoZSBjb3JyZXNwb25kaW5nIGVkaXRvclxuXHRcdFx0YXBwbHlTZXR0aW5ncygpIHtcblx0XHRcdFx0Y29uc3QgZWRpdG9yID0gdGhpcy5nZXRDdXJyZW50RWRpdG9yKCk7XG5cdFx0XHRcdGlmICghZWRpdG9yKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgY29uZmlnT3B0aW9ucyA9IHtzY29wZTogZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKX07XG5cdFx0XHRcdGNvbnN0IHtzZXR0aW5nc30gPSB0aGlzO1xuXG5cdFx0XHRcdGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldEJ1ZmZlcigpID09PSBidWZmZXIpIHtcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MuaW5kZW50X3N0eWxlID09PSAndW5zZXQnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB1c2VzU29mdFRhYnMgPSBlZGl0b3IudXNlc1NvZnRUYWJzKCk7XG5cdFx0XHRcdFx0XHRpZiAodXNlc1NvZnRUYWJzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0ZWRpdG9yLnNldFNvZnRUYWJzKGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnNvZnRUYWJzJywgY29uZmlnT3B0aW9ucykpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZWRpdG9yLnNldFNvZnRUYWJzKHVzZXNTb2Z0VGFicyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVkaXRvci5zZXRTb2Z0VGFicyhzZXR0aW5ncy5pbmRlbnRfc3R5bGUgPT09ICdzcGFjZScpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy50YWJfd2lkdGggPT09ICd1bnNldCcpIHtcblx0XHRcdFx0XHRcdGVkaXRvci5zZXRUYWJMZW5ndGgoYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJywgY29uZmlnT3B0aW9ucykpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlZGl0b3Iuc2V0VGFiTGVuZ3RoKHNldHRpbmdzLnRhYl93aWR0aCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmNoYXJzZXQgPT09ICd1bnNldCcpIHtcblx0XHRcdFx0XHRcdGJ1ZmZlci5zZXRFbmNvZGluZyhhdG9tLmNvbmZpZy5nZXQoJ2NvcmUuZmlsZUVuY29kaW5nJywgY29uZmlnT3B0aW9ucykpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2V0RW5jb2Rpbmcoc2V0dGluZ3MuY2hhcnNldCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTWF4X2xpbmVfbGVuZ3RoLXNldHRpbmdzXG5cdFx0XHRcdFx0Y29uc3QgZWRpdG9yUGFyYW1zID0ge307XG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLm1heF9saW5lX2xlbmd0aCA9PT0gJ3Vuc2V0Jykge1xuXHRcdFx0XHRcdFx0ZWRpdG9yUGFyYW1zLnByZWZlcnJlZExpbmVMZW5ndGggPVxuXHRcdFx0XHRcdFx0XHRhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5wcmVmZXJyZWRMaW5lTGVuZ3RoJywgY29uZmlnT3B0aW9ucyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVkaXRvclBhcmFtcy5wcmVmZXJyZWRMaW5lTGVuZ3RoID0gc2V0dGluZ3MubWF4X2xpbmVfbGVuZ3RoO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFVwZGF0ZSB0aGUgZWRpdG9yLXByb3BlcnRpZXNcblx0XHRcdFx0XHRlZGl0b3IudXBkYXRlKGVkaXRvclBhcmFtcyk7XG5cblx0XHRcdFx0XHQvLyBFbnN1cmUgdGhlIHdyYXAtZ3VpZGUgaXMgYmVpbmcgaW50ZXJjZXB0ZWRcblx0XHRcdFx0XHRjb25zdCBidWZmZXJEb20gPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcblx0XHRcdFx0XHRjb25zdCB3cmFwR3VpZGUgPSBidWZmZXJEb20ucXVlcnlTZWxlY3RvcignKiAvZGVlcC8gLndyYXAtZ3VpZGUnKTtcblx0XHRcdFx0XHRpZiAod3JhcEd1aWRlICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRpZiAod3JhcEd1aWRlLmVkaXRvcmNvbmZpZyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdHdyYXBHdWlkZS5lZGl0b3Jjb25maWcgPSB0aGlzO1xuXHRcdFx0XHRcdFx0XHR3cmFwR3VpZGUuZ2V0TmF0aXZlR3VpZGVDb2x1bW4gPSB3cmFwR3VpZGUuZ2V0R3VpZGVDb2x1bW47XG5cdFx0XHRcdFx0XHRcdHdyYXBHdWlkZS5nZXRHdWlkZUNvbHVtbiA9IHdyYXBHdWlkZUludGVyY2VwdG9yLmdldEd1aWRlQ29sdW1uLmJpbmQod3JhcEd1aWRlKTtcblx0XHRcdFx0XHRcdFx0d3JhcEd1aWRlLmdldE5hdGl2ZUd1aWRlc0NvbHVtbnMgPSB3cmFwR3VpZGUuZ2V0R3VpZGVzQ29sdW1ucztcblx0XHRcdFx0XHRcdFx0d3JhcEd1aWRlLmdldEd1aWRlc0NvbHVtbnMgPSB3cmFwR3VpZGVJbnRlcmNlcHRvci5nZXRHdWlkZXNDb2x1bW5zLmJpbmQod3JhcEd1aWRlKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiB3cmFwR3VpZGUudXBkYXRlR3VpZGUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0d3JhcEd1aWRlLnVwZGF0ZUd1aWRlKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBOQjogVGhpcyB3b24ndCB3b3JrIHdpdGggbXVsdGlwbGUgd3JhcC1ndWlkZXNcblx0XHRcdFx0XHRcdFx0Y29uc3QgY29sdW1uV2lkdGggPSBidWZmZXJEb20uZ2V0RGVmYXVsdENoYXJhY3RlcldpZHRoKCkgKiBlZGl0b3JQYXJhbXMucHJlZmVycmVkTGluZUxlbmd0aDtcblx0XHRcdFx0XHRcdFx0aWYgKGNvbHVtbldpZHRoID4gMCkge1xuXHRcdFx0XHRcdFx0XHRcdHdyYXBHdWlkZS5zdHlsZS5sZWZ0ID0gTWF0aC5yb3VuZChjb2x1bW5XaWR0aCkgKyAncHgnO1xuXHRcdFx0XHRcdFx0XHRcdHdyYXBHdWlkZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHR3cmFwR3VpZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5lbmRfb2ZfbGluZSAhPT0gJ3Vuc2V0Jykge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNldFByZWZlcnJlZExpbmVFbmRpbmcoc2V0dGluZ3MuZW5kX29mX2xpbmUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNldFN0YXRlKHRoaXMpO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gYG9uV2lsbFNhdmVgIGV2ZW50IGhhbmRsZXJcblx0XHRcdC8vIFRyaW1zIHdoaXRlc3BhY2VzIGFuZCBpbnNlcnRzL3N0cmlwcyBmaW5hbCBuZXdsaW5lIGJlZm9yZSBzYXZpbmdcblx0XHRcdG9uV2lsbFNhdmUoKSB7XG5cdFx0XHRcdGNvbnN0IHtzZXR0aW5nc30gPSB0aGlzO1xuXG5cdFx0XHRcdGlmIChzZXR0aW5ncy50cmltX3RyYWlsaW5nX3doaXRlc3BhY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRidWZmZXIuYmFja3dhcmRzU2NhbigvWyBcXHRdKyQvZ20sIHBhcmFtcyA9PiB7XG5cdFx0XHRcdFx0XHRpZiAocGFyYW1zLm1hdGNoWzBdLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdFx0cGFyYW1zLnJlcGxhY2UoJycpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHNldHRpbmdzLmluc2VydF9maW5hbF9uZXdsaW5lICE9PSAndW5zZXQnKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGFzdFJvdyA9IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XG5cblx0XHRcdFx0XHRpZiAoYnVmZmVyLmlzUm93QmxhbmsobGFzdFJvdykpIHtcblx0XHRcdFx0XHRcdGxldCBzdHJpcFN0YXJ0ID0gYnVmZmVyLnByZXZpb3VzTm9uQmxhbmtSb3cobGFzdFJvdyk7XG5cblx0XHRcdFx0XHRcdGlmIChzZXR0aW5ncy5pbnNlcnRfZmluYWxfbmV3bGluZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0XHRzdHJpcFN0YXJ0ICs9IDE7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIFN0cmlwIGVtcHR5IGxpbmVzIGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdFx0aWYgKHN0cmlwU3RhcnQgPCBsYXN0Um93KSB7XG5cdFx0XHRcdFx0XHRcdGJ1ZmZlci5kZWxldGVSb3dzKHN0cmlwU3RhcnQgKyAxLCBsYXN0Um93KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHNldHRpbmdzLmluc2VydF9maW5hbF9uZXdsaW5lID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuYXBwZW5kKCdcXG4nKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0YnVmZmVyLmVkaXRvcmNvbmZpZy5kaXNwb3NhYmxlcy5hZGQoXG5cdFx0XHRidWZmZXIub25XaWxsU2F2ZShidWZmZXIuZWRpdG9yY29uZmlnLm9uV2lsbFNhdmUuYmluZChidWZmZXIuZWRpdG9yY29uZmlnKSlcblx0XHQpO1xuXG5cdFx0aWYgKGJ1ZmZlci5nZXRVcmkoKSAmJiBidWZmZXIuZ2V0VXJpKCkubWF0Y2goL1tcXFxcfC9dXFwuZWRpdG9yY29uZmlnJC9nKSAhPT0gbnVsbCkge1xuXHRcdFx0YnVmZmVyLmVkaXRvcmNvbmZpZy5kaXNwb3NhYmxlcy5hZGQoXG5cdFx0XHRcdGJ1ZmZlci5vbkRpZFNhdmUocmVhcHBseUVkaXRvcmNvbmZpZylcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG59XG5cbi8vIFJldmVhbCBhbmQgYXBwbHkgdGhlIGVkaXRvcmNvbmZpZyBmb3IgdGhlIGdpdmVuIFRleHRFZGl0b3ItaW5zdGFuY2VcbmZ1bmN0aW9uIG9ic2VydmVUZXh0RWRpdG9yKGVkaXRvcikge1xuXHRpZiAoIWVkaXRvcikge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGluaXRpYWxpemVUZXh0QnVmZmVyKGVkaXRvci5nZXRCdWZmZXIoKSk7XG5cblx0Y29uc3QgZmlsZSA9IGVkaXRvci5nZXRVUkkoKTtcblx0aWYgKCFmaWxlKSB7XG5cdFx0ZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XG5cdFx0XHRvYnNlcnZlVGV4dEVkaXRvcihlZGl0b3IpO1xuXHRcdH0pO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGVkaXRvcmNvbmZpZy5wYXJzZShmaWxlKS50aGVuKGNvbmZpZyA9PiB7XG5cdFx0aWYgKE9iamVjdC5rZXlzKGNvbmZpZykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZWNmZyA9IGVkaXRvci5nZXRCdWZmZXIoKS5lZGl0b3Jjb25maWc7XG5cdFx0Y29uc3Qge3NldHRpbmdzfSA9IGVjZmc7XG5cdFx0Y29uc3QgbGluZUVuZGluZ3MgPSB7XG5cdFx0XHRjcmxmOiAnXFxyXFxuJyxcblx0XHRcdGNyOiAnXFxyJyxcblx0XHRcdGxmOiAnXFxuJ1xuXHRcdH07XG5cblx0XHQvLyBQcmVzZXJ2ZSBldmFsdWF0ZWQgRWRpdG9yY29uZmlnXG5cdFx0ZWNmZy5jb25maWcgPSBjb25maWc7XG5cblx0XHQvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cblxuXHRcdC8vIENhcmVmdWxseSBub3JtYWxpemUgYW5kIGluaXRpYWxpemUgY29uZmlnLXNldHRpbmdzXG5cdFx0c2V0dGluZ3MudHJpbV90cmFpbGluZ193aGl0ZXNwYWNlID0gKCd0cmltX3RyYWlsaW5nX3doaXRlc3BhY2UnIGluIGNvbmZpZykgJiZcblx0XHRcdHR5cGVvZiBjb25maWcudHJpbV90cmFpbGluZ193aGl0ZXNwYWNlID09PSAnYm9vbGVhbicgP1xuXHRcdFx0Y29uZmlnLnRyaW1fdHJhaWxpbmdfd2hpdGVzcGFjZSA9PT0gdHJ1ZSA6XG5cdFx0XHQndW5zZXQnO1xuXG5cdFx0c2V0dGluZ3MuaW5zZXJ0X2ZpbmFsX25ld2xpbmUgPSAoJ2luc2VydF9maW5hbF9uZXdsaW5lJyBpbiBjb25maWcpICYmXG5cdFx0XHR0eXBlb2YgY29uZmlnLmluc2VydF9maW5hbF9uZXdsaW5lID09PSAnYm9vbGVhbicgP1xuXHRcdFx0Y29uZmlnLmluc2VydF9maW5hbF9uZXdsaW5lID09PSB0cnVlIDpcblx0XHRcdCd1bnNldCc7XG5cblx0XHRzZXR0aW5ncy5pbmRlbnRfc3R5bGUgPSAoKCdpbmRlbnRfc3R5bGUnIGluIGNvbmZpZykgJiZcblx0XHRcdGNvbmZpZy5pbmRlbnRfc3R5bGUuc2VhcmNoKC9eKHNwYWNlfHRhYikkLykgPiAtMSkgP1xuXHRcdFx0Y29uZmlnLmluZGVudF9zdHlsZSA6XG5cdFx0XHQndW5zZXQnO1xuXG5cdFx0c2V0dGluZ3MuZW5kX29mX2xpbmUgPSBsaW5lRW5kaW5nc1tjb25maWcuZW5kX29mX2xpbmVdIHx8ICd1bnNldCc7XG5cblx0XHRzZXR0aW5ncy50YWJfd2lkdGggPSBwYXJzZUludChjb25maWcuaW5kZW50X3NpemUgfHwgY29uZmlnLnRhYl93aWR0aCwgMTApO1xuXHRcdGlmIChpc05hTihzZXR0aW5ncy50YWJfd2lkdGgpIHx8IHNldHRpbmdzLnRhYl93aWR0aCA8PSAwKSB7XG5cdFx0XHRzZXR0aW5ncy50YWJfd2lkdGggPSAndW5zZXQnO1xuXHRcdH1cblxuXHRcdHNldHRpbmdzLm1heF9saW5lX2xlbmd0aCA9IHBhcnNlSW50KGNvbmZpZy5tYXhfbGluZV9sZW5ndGgsIDEwKTtcblx0XHRpZiAoaXNOYU4oc2V0dGluZ3MubWF4X2xpbmVfbGVuZ3RoKSB8fCBzZXR0aW5ncy5tYXhfbGluZV9sZW5ndGggPD0gMCkge1xuXHRcdFx0c2V0dGluZ3MubWF4X2xpbmVfbGVuZ3RoID0gJ3Vuc2V0Jztcblx0XHR9XG5cblx0XHRzZXR0aW5ncy5jaGFyc2V0ID0gKCdjaGFyc2V0JyBpbiBjb25maWcpID9cblx0XHRcdGNvbmZpZy5jaGFyc2V0LnJlcGxhY2UoLy0vZywgJycpLnRvTG93ZXJDYXNlKCkgOlxuXHRcdFx0J3Vuc2V0JztcblxuXHRcdC8vICMyMjc6IEFsbG93IGBsYXRpbjFgIGFzIGFuIGFsaWFzIG9mIElTTyA4ODU5LTEuXG5cdFx0aWYgKFN0cmluZyhzZXR0aW5ncy5jaGFyc2V0KS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcVy9nLCAnJykgPT09ICdsYXRpbjEnKSB7XG5cdFx0XHRzZXR0aW5ncy5jaGFyc2V0ID0gJ2lzbzg4NTkxJztcblx0XHR9XG5cblx0XHQvKiBlc2xpbnQtZW5hYmxlIGNhbWVsY2FzZSAqL1xuXG5cdFx0ZWNmZy5hcHBseVNldHRpbmdzKCk7XG5cdH0pLmNhdGNoKGVycm9yID0+IHtcblx0XHRjb25zb2xlLndhcm4oYGF0b20tZWRpdG9yY29uZmlnOiAke2Vycm9yfWApO1xuXHR9KTtcbn1cblxuLy8gUmVhcHBsaWVzIHRoZSB3aG9sZSBlZGl0b3Jjb25maWcgdG8gKiphbGwqKiBvcGVuIFRleHRFZGl0b3ItaW5zdGFuY2VzXG5mdW5jdGlvbiByZWFwcGx5RWRpdG9yY29uZmlnKCkge1xuXHRjb25zdCB0ZXh0RWRpdG9ycyA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCk7XG5cdHRleHRFZGl0b3JzLmZvckVhY2goZWRpdG9yID0+IHtcblx0XHRvYnNlcnZlVGV4dEVkaXRvcihlZGl0b3IpO1xuXHR9KTtcbn1cblxuLy8gUmVhcHBsaWVzIHRoZSBzZXR0aW5ncyBpbW1lZGlhdGVseSBhZnRlciBjaGFuZ2luZyB0aGUgZm9jdXMgdG8gYSBuZXcgcGFuZVxuZnVuY3Rpb24gb2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKGVkaXRvcikge1xuXHRpZiAoZWRpdG9yICYmIGVkaXRvci5jb25zdHJ1Y3Rvci5uYW1lID09PSAnVGV4dEVkaXRvcicpIHtcblx0XHRpZiAoZWRpdG9yLmJ1ZmZlciAmJiBlZGl0b3IuYnVmZmVyLmVkaXRvcmNvbmZpZykge1xuXHRcdFx0ZWRpdG9yLmJ1ZmZlci5lZGl0b3Jjb25maWcuYXBwbHlTZXR0aW5ncygpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRzdGF0dXNUaWxlLnJlbW92ZUljb24oKTtcblx0fVxufVxuXG4vLyBIb29rIGludG8gdGhlIGV2ZW50cyB0byByZWNvZ25pemUgdGhlIHVzZXIgb3BlbmluZyBuZXcgZWRpdG9ycyBvciBjaGFuZ2luZyB0aGUgcGFuZVxuY29uc3QgYWN0aXZhdGUgPSAoKSA9PiB7XG5cdGdlbmVyYXRlQ29uZmlnKCk7XG5cdHNob3dTdGF0ZSgpO1xuXHRmaXhGaWxlKCk7XG5cdGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyhvYnNlcnZlVGV4dEVkaXRvcik7XG5cdGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbShvYnNlcnZlQWN0aXZlUGFuZUl0ZW0pO1xuXHRyZWFwcGx5RWRpdG9yY29uZmlnKCk7XG5cblx0Ly8gIzIyMDogRml4IHNwdXJpb3VzIFwidGhyYXNoaW5nXCIgaW4gb3BlbiBlZGl0b3JzIGF0IHN0YXJ0dXBcblx0aWYgKCFhdG9tLnBhY2thZ2VzLmhhc0FjdGl2YXRlZEluaXRpYWxQYWNrYWdlcygpKSB7XG5cdFx0Y29uc3QgZGlzcG9zYWJsZXMgPSBuZXcgKGF0bS5Db21wb3NpdGVEaXNwb3NhYmxlKSgpO1xuXHRcdGRpc3Bvc2FibGVzLmFkZChcblx0XHRcdGF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZVBhY2thZ2UocGtnID0+IHtcblx0XHRcdFx0aWYgKHBrZy5uYW1lID09PSAnd2hpdGVzcGFjZScgfHwgcGtnLm5hbWUgPT09ICd3cmFwLWd1aWRlJykge1xuXHRcdFx0XHRcdHJlYXBwbHlFZGl0b3Jjb25maWcoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSksXG5cdFx0XHRhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVJbml0aWFsUGFja2FnZXMoKCkgPT4ge1xuXHRcdFx0XHRkaXNwb3NhYmxlcy5kaXNwb3NlKCk7XG5cdFx0XHRcdHJlYXBwbHlFZGl0b3Jjb25maWcoKTtcblx0XHRcdH0pXG5cdFx0KTtcblx0fVxufTtcblxuLy8gQ2xlYW4gdGhlIHN0YXR1cy1pY29uIHVwLCByZW1vdmUgYWxsIGVtYmVkZGVkIGVkaXRvcmNvbmZpZy1vYmplY3RzXG5jb25zdCBkZWFjdGl2YXRlID0gKCkgPT4ge1xuXHRjb25zdCB0ZXh0RWRpdG9ycyA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCk7XG5cdHRleHRFZGl0b3JzLmZvckVhY2goZWRpdG9yID0+IHtcblx0XHRlZGl0b3IuZ2V0QnVmZmVyKCkuZWRpdG9yY29uZmlnLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcblx0fSk7XG5cdHN0YXR1c1RpbGUucmVtb3ZlSWNvbigpO1xufTtcblxuLy8gQXBwbHkgdGhlIHN0YXR1c2JhciBpY29uLWNvbnRhaW5lclxuLy8gVGhlIGljb24gd2lsbCBiZSBhcHBsaWVkIGlmIG5lZWRlZFxuY29uc3QgY29uc3VtZVN0YXR1c0JhciA9IHN0YXR1c0JhciA9PiB7XG5cdGlmIChzdGF0dXNUaWxlLmNvbnRhaW5lckV4aXN0cygpID09PSBmYWxzZSkge1xuXHRcdHN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuXHRcdFx0aXRlbTogc3RhdHVzVGlsZS5jcmVhdGVDb250YWluZXIoKSxcblx0XHRcdHByaW9yaXR5OiA5OTlcblx0XHR9KTtcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQge2FjdGl2YXRlLCBkZWFjdGl2YXRlLCBjb25zdW1lU3RhdHVzQmFyfTtcbiJdfQ==