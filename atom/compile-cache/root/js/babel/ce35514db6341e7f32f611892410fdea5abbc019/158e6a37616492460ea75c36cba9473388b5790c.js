Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.$range = $range;
exports.$file = $file;
exports.copySelection = copySelection;
exports.getPathOfMessage = getPathOfMessage;
exports.getActiveTextEditor = getActiveTextEditor;
exports.getEditorsMap = getEditorsMap;
exports.filterMessages = filterMessages;
exports.filterMessagesByRangeOrPoint = filterMessagesByRangeOrPoint;
exports.openFile = openFile;
exports.visitMessage = visitMessage;
exports.openExternally = openExternally;
exports.sortMessages = sortMessages;
exports.sortSolutions = sortSolutions;
exports.applySolution = applySolution;

var _atom = require('atom');

var _electron = require('electron');

var severityScore = {
  error: 3,
  warning: 2,
  info: 1
};

exports.severityScore = severityScore;
var severityNames = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info'
};
exports.severityNames = severityNames;
var WORKSPACE_URI = 'atom://linter-ui-default';

exports.WORKSPACE_URI = WORKSPACE_URI;

function $range(message) {
  return message.version === 1 ? message.range : message.location.position;
}

function $file(message) {
  return message.version === 1 ? message.filePath : message.location.file;
}

function copySelection() {
  var selection = getSelection();
  if (selection) {
    atom.clipboard.write(selection.toString());
  }
}

function getPathOfMessage(message) {
  return atom.project.relativizePath($file(message) || '')[1];
}

function getActiveTextEditor() {
  var paneItem = atom.workspace.getCenter().getActivePaneItem();
  return atom.workspace.isTextEditor(paneItem) ? paneItem : null;
}

function getEditorsMap(editors) {
  var editorsMap = {};
  var filePaths = [];
  for (var entry of editors.editors) {
    var filePath = entry.textEditor.getPath();
    if (editorsMap[filePath]) {
      editorsMap[filePath].editors.push(entry);
    } else {
      editorsMap[filePath] = {
        added: [],
        removed: [],
        editors: [entry]
      };
      filePaths.push(filePath);
    }
  }
  return { editorsMap: editorsMap, filePaths: filePaths };
}

function filterMessages(messages, filePath) {
  var severity = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var filtered = [];
  messages.forEach(function (message) {
    if ((filePath === null || $file(message) === filePath) && (!severity || message.severity === severity)) {
      filtered.push(message);
    }
  });
  return filtered;
}

function filterMessagesByRangeOrPoint(messages, filePath, rangeOrPoint) {
  var filtered = [];
  var expectedRange = rangeOrPoint.constructor.name === 'Point' ? new _atom.Range(rangeOrPoint, rangeOrPoint) : _atom.Range.fromObject(rangeOrPoint);
  messages.forEach(function (message) {
    var file = $file(message);
    var range = $range(message);
    if (file && range && file === filePath && range.intersectsWith(expectedRange)) {
      filtered.push(message);
    }
  });
  return filtered;
}

function openFile(file, position) {
  var options = {};
  options.searchAllPanes = true;
  if (position) {
    options.initialLine = position.row;
    options.initialColumn = position.column;
  }
  atom.workspace.open(file, options);
}

function visitMessage(message) {
  var reference = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  var messageFile = undefined;
  var messagePosition = undefined;
  if (reference) {
    if (message.version !== 2) {
      console.warn('[Linter-UI-Default] Only messages v2 are allowed in jump to reference. Ignoring');
      return;
    }
    if (!message.reference || !message.reference.file) {
      console.warn('[Linter-UI-Default] Message does not have a valid reference. Ignoring');
      return;
    }
    messageFile = message.reference.file;
    messagePosition = message.reference.position;
  } else {
    var messageRange = $range(message);
    messageFile = $file(message);
    if (messageRange) {
      messagePosition = messageRange.start;
    }
  }
  if (messageFile) {
    openFile(messageFile, messagePosition);
  }
}

function openExternally(message) {
  if (message.version === 2 && message.url) {
    _electron.shell.openExternal(message.url);
  }
}

function sortMessages(sortInfo, rows) {
  var sortColumns = {};

  sortInfo.forEach(function (entry) {
    sortColumns[entry.column] = entry.type;
  });

  return rows.slice().sort(function (a, b) {
    if (sortColumns.severity) {
      var multiplyWith = sortColumns.severity === 'asc' ? 1 : -1;
      var severityA = severityScore[a.severity];
      var severityB = severityScore[b.severity];
      if (severityA !== severityB) {
        return multiplyWith * (severityA > severityB ? 1 : -1);
      }
    }
    if (sortColumns.linterName) {
      var multiplyWith = sortColumns.linterName === 'asc' ? 1 : -1;
      var sortValue = a.severity.localeCompare(b.severity);
      if (sortValue !== 0) {
        return multiplyWith * sortValue;
      }
    }
    if (sortColumns.file) {
      var multiplyWith = sortColumns.file === 'asc' ? 1 : -1;
      var fileA = getPathOfMessage(a);
      var fileALength = fileA.length;
      var fileB = getPathOfMessage(b);
      var fileBLength = fileB.length;
      if (fileALength !== fileBLength) {
        return multiplyWith * (fileALength > fileBLength ? 1 : -1);
      } else if (fileA !== fileB) {
        return multiplyWith * fileA.localeCompare(fileB);
      }
    }
    if (sortColumns.line) {
      var multiplyWith = sortColumns.line === 'asc' ? 1 : -1;
      var rangeA = $range(a);
      var rangeB = $range(b);
      if (rangeA && !rangeB) {
        return 1;
      } else if (rangeB && !rangeA) {
        return -1;
      } else if (rangeA && rangeB) {
        if (rangeA.start.row !== rangeB.start.row) {
          return multiplyWith * (rangeA.start.row > rangeB.start.row ? 1 : -1);
        }
        if (rangeA.start.column !== rangeB.start.column) {
          return multiplyWith * (rangeA.start.column > rangeB.start.column ? 1 : -1);
        }
      }
    }

    return 0;
  });
}

function sortSolutions(solutions) {
  return solutions.slice().sort(function (a, b) {
    return b.priority - a.priority;
  });
}

function applySolution(textEditor, version, solution) {
  if (solution.apply) {
    solution.apply();
    return true;
  }
  var range = version === 1 ? solution.range : solution.position;
  var currentText = version === 1 ? solution.oldText : solution.currentText;
  var replaceWith = version === 1 ? solution.newText : solution.replaceWith;
  if (currentText) {
    var textInRange = textEditor.getTextInBufferRange(range);
    if (currentText !== textInRange) {
      console.warn('[linter-ui-default] Not applying fix because text did not match the expected one', 'expected', currentText, 'but got', textInRange);
      return false;
    }
  }
  textEditor.setTextInBufferRange(range, replaceWith);
  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQUVzQixNQUFNOzt3QkFDTixVQUFVOztBQUt6QixJQUFNLGFBQWEsR0FBRztBQUMzQixPQUFLLEVBQUUsQ0FBQztBQUNSLFNBQU8sRUFBRSxDQUFDO0FBQ1YsTUFBSSxFQUFFLENBQUM7Q0FDUixDQUFBOzs7QUFFTSxJQUFNLGFBQWEsR0FBRztBQUMzQixPQUFLLEVBQUUsT0FBTztBQUNkLFNBQU8sRUFBRSxTQUFTO0FBQ2xCLE1BQUksRUFBRSxNQUFNO0NBQ2IsQ0FBQTs7QUFDTSxJQUFNLGFBQWEsR0FBRywwQkFBMEIsQ0FBQTs7OztBQUVoRCxTQUFTLE1BQU0sQ0FBQyxPQUFzQixFQUFXO0FBQ3RELFNBQU8sT0FBTyxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQTtDQUN6RTs7QUFDTSxTQUFTLEtBQUssQ0FBQyxPQUFzQixFQUFXO0FBQ3JELFNBQU8sT0FBTyxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQTtDQUN4RTs7QUFDTSxTQUFTLGFBQWEsR0FBRztBQUM5QixNQUFNLFNBQVMsR0FBRyxZQUFZLEVBQUUsQ0FBQTtBQUNoQyxNQUFJLFNBQVMsRUFBRTtBQUNiLFFBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO0dBQzNDO0NBQ0Y7O0FBQ00sU0FBUyxnQkFBZ0IsQ0FBQyxPQUFzQixFQUFVO0FBQy9ELFNBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUs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T0FBTyxLQUFLLENBQUMsR0FBRyxRQUFRLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUE7QUFDM0UsTUFBSSxXQUFXLEVBQUU7QUFDZixRQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDMUQsUUFBSSxXQUFXLEtBQUssV0FBVyxFQUFFO0FBQy9CLGFBQU8sQ0FBQyxJQUFJLENBQUMsa0ZBQWtGLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUE7QUFDakosYUFBTyxLQUFLLENBQUE7S0FDYjtHQUNGO0FBQ0QsWUFBVSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUNuRCxTQUFPLElBQUksQ0FBQTtDQUNaIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2hlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBSYW5nZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJ1xuaW1wb3J0IHR5cGUgeyBQb2ludCwgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgdHlwZSBFZGl0b3JzIGZyb20gJy4vZWRpdG9ycydcbmltcG9ydCB0eXBlIHsgTGludGVyTWVzc2FnZSB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBzZXZlcml0eVNjb3JlID0ge1xuICBlcnJvcjogMyxcbiAgd2FybmluZzogMixcbiAgaW5mbzogMSxcbn1cblxuZXhwb3J0IGNvbnN0IHNldmVyaXR5TmFtZXMgPSB7XG4gIGVycm9yOiAnRXJyb3InLFxuICB3YXJuaW5nOiAnV2FybmluZycsXG4gIGluZm86ICdJbmZvJyxcbn1cbmV4cG9ydCBjb25zdCBXT1JLU1BBQ0VfVVJJID0gJ2F0b206Ly9saW50ZXItdWktZGVmYXVsdCdcblxuZXhwb3J0IGZ1bmN0aW9uICRyYW5nZShtZXNzYWdlOiBMaW50ZXJNZXNzYWdlKTogP09iamVjdCB7XG4gIHJldHVybiBtZXNzYWdlLnZlcnNpb24gPT09IDEgPyBtZXNzYWdlLnJhbmdlIDogbWVzc2FnZS5sb2NhdGlvbi5wb3NpdGlvblxufVxuZXhwb3J0IGZ1bmN0aW9uICRmaWxlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UpOiA/c3RyaW5nIHtcbiAgcmV0dXJuIG1lc3NhZ2UudmVyc2lvbiA9PT0gMSA/IG1lc3NhZ2UuZmlsZVBhdGggOiBtZXNzYWdlLmxvY2F0aW9uLmZpbGVcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb3B5U2VsZWN0aW9uKCkge1xuICBjb25zdCBzZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb24oKVxuICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoc2VsZWN0aW9uLnRvU3RyaW5nKCkpXG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXRoT2ZNZXNzYWdlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UpOiBzdHJpbmcge1xuICByZXR1cm4gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKCRmaWxlKG1lc3NhZ2UpIHx8ICcnKVsxXVxufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVRleHRFZGl0b3IoKTogP1RleHRFZGl0b3Ige1xuICBjb25zdCBwYW5lSXRlbSA9IGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLmdldEFjdGl2ZVBhbmVJdGVtKClcbiAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihwYW5lSXRlbSkgPyBwYW5lSXRlbSA6IG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVkaXRvcnNNYXAoZWRpdG9yczogRWRpdG9ycyk6IHsgZWRpdG9yc01hcDogT2JqZWN0LCBmaWxlUGF0aHM6IEFycmF5PHN0cmluZz4gfSB7XG4gIGNvbnN0IGVkaXRvcnNNYXAgPSB7fVxuICBjb25zdCBmaWxlUGF0aHMgPSBbXVxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVkaXRvcnMuZWRpdG9ycykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gZW50cnkudGV4dEVkaXRvci5nZXRQYXRoKClcbiAgICBpZiAoZWRpdG9yc01hcFtmaWxlUGF0aF0pIHtcbiAgICAgIGVkaXRvcnNNYXBbZmlsZVBhdGhdLmVkaXRvcnMucHVzaChlbnRyeSlcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdG9yc01hcFtmaWxlUGF0aF0gPSB7XG4gICAgICAgIGFkZGVkOiBbXSxcbiAgICAgICAgcmVtb3ZlZDogW10sXG4gICAgICAgIGVkaXRvcnM6IFtlbnRyeV0sXG4gICAgICB9XG4gICAgICBmaWxlUGF0aHMucHVzaChmaWxlUGF0aClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgZWRpdG9yc01hcCwgZmlsZVBhdGhzIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlck1lc3NhZ2VzKG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPiwgZmlsZVBhdGg6ID9zdHJpbmcsIHNldmVyaXR5OiA/c3RyaW5nID0gbnVsbCk6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3QgZmlsdGVyZWQgPSBbXVxuICBtZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBpZiAoKGZpbGVQYXRoID09PSBudWxsIHx8ICRmaWxlKG1lc3NhZ2UpID09PSBmaWxlUGF0aCkgJiYgKCFzZXZlcml0eSB8fCBtZXNzYWdlLnNldmVyaXR5ID09PSBzZXZlcml0eSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobWVzc2FnZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBmaWx0ZXJlZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTWVzc2FnZXNCeVJhbmdlT3JQb2ludChtZXNzYWdlczogU2V0PExpbnRlck1lc3NhZ2U+IHwgQXJyYXk8TGludGVyTWVzc2FnZT4sIGZpbGVQYXRoOiBzdHJpbmcsIHJhbmdlT3JQb2ludDogUG9pbnQgfCBSYW5nZSk6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3QgZmlsdGVyZWQgPSBbXVxuICBjb25zdCBleHBlY3RlZFJhbmdlID0gcmFuZ2VPclBvaW50LmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQb2ludCcgPyBuZXcgUmFuZ2UocmFuZ2VPclBvaW50LCByYW5nZU9yUG9pbnQpIDogUmFuZ2UuZnJvbU9iamVjdChyYW5nZU9yUG9pbnQpXG4gIG1lc3NhZ2VzLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnN0IGZpbGUgPSAkZmlsZShtZXNzYWdlKVxuICAgIGNvbnN0IHJhbmdlID0gJHJhbmdlKG1lc3NhZ2UpXG4gICAgaWYgKGZpbGUgJiYgcmFuZ2UgJiYgZmlsZSA9PT0gZmlsZVBhdGggJiYgcmFuZ2UuaW50ZXJzZWN0c1dpdGgoZXhwZWN0ZWRSYW5nZSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobWVzc2FnZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBmaWx0ZXJlZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkZpbGUoZmlsZTogc3RyaW5nLCBwb3NpdGlvbjogP1BvaW50KSB7XG4gIGNvbnN0IG9wdGlvbnMgPSB7fVxuICBvcHRpb25zLnNlYXJjaEFsbFBhbmVzID0gdHJ1ZVxuICBpZiAocG9zaXRpb24pIHtcbiAgICBvcHRpb25zLmluaXRpYWxMaW5lID0gcG9zaXRpb24ucm93XG4gICAgb3B0aW9ucy5pbml0aWFsQ29sdW1uID0gcG9zaXRpb24uY29sdW1uXG4gIH1cbiAgYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlLCBvcHRpb25zKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRNZXNzYWdlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UsIHJlZmVyZW5jZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGxldCBtZXNzYWdlRmlsZVxuICBsZXQgbWVzc2FnZVBvc2l0aW9uXG4gIGlmIChyZWZlcmVuY2UpIHtcbiAgICBpZiAobWVzc2FnZS52ZXJzaW9uICE9PSAyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tMaW50ZXItVUktRGVmYXVsdF0gT25seSBtZXNzYWdlcyB2MiBhcmUgYWxsb3dlZCBpbiBqdW1wIHRvIHJlZmVyZW5jZS4gSWdub3JpbmcnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5yZWZlcmVuY2UgfHwgIW1lc3NhZ2UucmVmZXJlbmNlLmZpbGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignW0xpbnRlci1VSS1EZWZhdWx0XSBNZXNzYWdlIGRvZXMgbm90IGhhdmUgYSB2YWxpZCByZWZlcmVuY2UuIElnbm9yaW5nJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBtZXNzYWdlRmlsZSA9IG1lc3NhZ2UucmVmZXJlbmNlLmZpbGVcbiAgICBtZXNzYWdlUG9zaXRpb24gPSBtZXNzYWdlLnJlZmVyZW5jZS5wb3NpdGlvblxuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1lc3NhZ2VSYW5nZSA9ICRyYW5nZShtZXNzYWdlKVxuICAgIG1lc3NhZ2VGaWxlID0gJGZpbGUobWVzc2FnZSlcbiAgICBpZiAobWVzc2FnZVJhbmdlKSB7XG4gICAgICBtZXNzYWdlUG9zaXRpb24gPSBtZXNzYWdlUmFuZ2Uuc3RhcnRcbiAgICB9XG4gIH1cbiAgaWYgKG1lc3NhZ2VGaWxlKSB7XG4gICAgb3BlbkZpbGUobWVzc2FnZUZpbGUsIG1lc3NhZ2VQb3NpdGlvbilcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkV4dGVybmFsbHkobWVzc2FnZTogTGludGVyTWVzc2FnZSk6IHZvaWQge1xuICBpZiAobWVzc2FnZS52ZXJzaW9uID09PSAyICYmIG1lc3NhZ2UudXJsKSB7XG4gICAgc2hlbGwub3BlbkV4dGVybmFsKG1lc3NhZ2UudXJsKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0TWVzc2FnZXMoc29ydEluZm86IEFycmF5PHsgY29sdW1uOiBzdHJpbmcsIHR5cGU6ICdhc2MnIHwgJ2Rlc2MnIH0+LCByb3dzOiBBcnJheTxMaW50ZXJNZXNzYWdlPik6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3Qgc29ydENvbHVtbnMgOiB7XG4gICAgc2V2ZXJpdHk/OiAnYXNjJyB8ICdkZXNjJyxcbiAgICBsaW50ZXJOYW1lPzogJ2FzYycgfCAnZGVzYycsXG4gICAgZmlsZT86ICdhc2MnIHwgJ2Rlc2MnLFxuICAgIGxpbmU/OiAnYXNjJyB8ICdkZXNjJ1xuICB9ID0ge31cblxuICBzb3J0SW5mby5mb3JFYWNoKGZ1bmN0aW9uKGVudHJ5KSB7XG4gICAgc29ydENvbHVtbnNbZW50cnkuY29sdW1uXSA9IGVudHJ5LnR5cGVcbiAgfSlcblxuICByZXR1cm4gcm93cy5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIGlmIChzb3J0Q29sdW1ucy5zZXZlcml0eSkge1xuICAgICAgY29uc3QgbXVsdGlwbHlXaXRoID0gc29ydENvbHVtbnMuc2V2ZXJpdHkgPT09ICdhc2MnID8gMSA6IC0xXG4gICAgICBjb25zdCBzZXZlcml0eUEgPSBzZXZlcml0eVNjb3JlW2Euc2V2ZXJpdHldXG4gICAgICBjb25zdCBzZXZlcml0eUIgPSBzZXZlcml0eVNjb3JlW2Iuc2V2ZXJpdHldXG4gICAgICBpZiAoc2V2ZXJpdHlBICE9PSBzZXZlcml0eUIpIHtcbiAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIChzZXZlcml0eUEgPiBzZXZlcml0eUIgPyAxIDogLTEpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzb3J0Q29sdW1ucy5saW50ZXJOYW1lKSB7XG4gICAgICBjb25zdCBtdWx0aXBseVdpdGggPSBzb3J0Q29sdW1ucy5saW50ZXJOYW1lID09PSAnYXNjJyA/IDEgOiAtMVxuICAgICAgY29uc3Qgc29ydFZhbHVlID0gYS5zZXZlcml0eS5sb2NhbGVDb21wYXJlKGIuc2V2ZXJpdHkpXG4gICAgICBpZiAoc29ydFZhbHVlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiBzb3J0VmFsdWVcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNvcnRDb2x1bW5zLmZpbGUpIHtcbiAgICAgIGNvbnN0IG11bHRpcGx5V2l0aCA9IHNvcnRDb2x1bW5zLmZpbGUgPT09ICdhc2MnID8gMSA6IC0xXG4gICAgICBjb25zdCBmaWxlQSA9IGdldFBhdGhPZk1lc3NhZ2UoYSlcbiAgICAgIGNvbnN0IGZpbGVBTGVuZ3RoID0gZmlsZUEubGVuZ3RoXG4gICAgICBjb25zdCBmaWxlQiA9IGdldFBhdGhPZk1lc3NhZ2UoYilcbiAgICAgIGNvbnN0IGZpbGVCTGVuZ3RoID0gZmlsZUIubGVuZ3RoXG4gICAgICBpZiAoZmlsZUFMZW5ndGggIT09IGZpbGVCTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiAoZmlsZUFMZW5ndGggPiBmaWxlQkxlbmd0aCA/IDEgOiAtMSlcbiAgICAgIH0gZWxzZSBpZiAoZmlsZUEgIT09IGZpbGVCKSB7XG4gICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiBmaWxlQS5sb2NhbGVDb21wYXJlKGZpbGVCKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc29ydENvbHVtbnMubGluZSkge1xuICAgICAgY29uc3QgbXVsdGlwbHlXaXRoID0gc29ydENvbHVtbnMubGluZSA9PT0gJ2FzYycgPyAxIDogLTFcbiAgICAgIGNvbnN0IHJhbmdlQSA9ICRyYW5nZShhKVxuICAgICAgY29uc3QgcmFuZ2VCID0gJHJhbmdlKGIpXG4gICAgICBpZiAocmFuZ2VBICYmICFyYW5nZUIpIHtcbiAgICAgICAgcmV0dXJuIDFcbiAgICAgIH0gZWxzZSBpZiAocmFuZ2VCICYmICFyYW5nZUEpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9IGVsc2UgaWYgKHJhbmdlQSAmJiByYW5nZUIpIHtcbiAgICAgICAgaWYgKHJhbmdlQS5zdGFydC5yb3cgIT09IHJhbmdlQi5zdGFydC5yb3cpIHtcbiAgICAgICAgICByZXR1cm4gbXVsdGlwbHlXaXRoICogKHJhbmdlQS5zdGFydC5yb3cgPiByYW5nZUIuc3RhcnQucm93ID8gMSA6IC0xKVxuICAgICAgICB9XG4gICAgICAgIGlmIChyYW5nZUEuc3RhcnQuY29sdW1uICE9PSByYW5nZUIuc3RhcnQuY29sdW1uKSB7XG4gICAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIChyYW5nZUEuc3RhcnQuY29sdW1uID4gcmFuZ2VCLnN0YXJ0LmNvbHVtbiA/IDEgOiAtMSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAwXG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0U29sdXRpb25zKHNvbHV0aW9uczogQXJyYXk8T2JqZWN0Pik6IEFycmF5PE9iamVjdD4ge1xuICByZXR1cm4gc29sdXRpb25zLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGIucHJpb3JpdHkgLSBhLnByaW9yaXR5XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVNvbHV0aW9uKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHZlcnNpb246IDEgfCAyLCBzb2x1dGlvbjogT2JqZWN0KTogYm9vbGVhbiB7XG4gIGlmIChzb2x1dGlvbi5hcHBseSkge1xuICAgIHNvbHV0aW9uLmFwcGx5KClcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IHJhbmdlID0gdmVyc2lvbiA9PT0gMSA/IHNvbHV0aW9uLnJhbmdlIDogc29sdXRpb24ucG9zaXRpb25cbiAgY29uc3QgY3VycmVudFRleHQgPSB2ZXJzaW9uID09PSAxID8gc29sdXRpb24ub2xkVGV4dCA6IHNvbHV0aW9uLmN1cnJlbnRUZXh0XG4gIGNvbnN0IHJlcGxhY2VXaXRoID0gdmVyc2lvbiA9PT0gMSA/IHNvbHV0aW9uLm5ld1RleHQgOiBzb2x1dGlvbi5yZXBsYWNlV2l0aFxuICBpZiAoY3VycmVudFRleHQpIHtcbiAgICBjb25zdCB0ZXh0SW5SYW5nZSA9IHRleHRFZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgaWYgKGN1cnJlbnRUZXh0ICE9PSB0ZXh0SW5SYW5nZSkge1xuICAgICAgY29uc29sZS53YXJuKCdbbGludGVyLXVpLWRlZmF1bHRdIE5vdCBhcHBseWluZyBmaXggYmVjYXVzZSB0ZXh0IGRpZCBub3QgbWF0Y2ggdGhlIGV4cGVjdGVkIG9uZScsICdleHBlY3RlZCcsIGN1cnJlbnRUZXh0LCAnYnV0IGdvdCcsIHRleHRJblJhbmdlKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHRleHRFZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsIHJlcGxhY2VXaXRoKVxuICByZXR1cm4gdHJ1ZVxufVxuIl19