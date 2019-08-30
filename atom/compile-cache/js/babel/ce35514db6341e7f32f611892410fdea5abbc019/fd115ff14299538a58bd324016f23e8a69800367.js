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

var lastPaneItem = null;
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
  var paneIsTextEditor = atom.workspace.isTextEditor(paneItem);
  if (!paneIsTextEditor && paneItem && lastPaneItem && paneItem.getURI && paneItem.getURI() === WORKSPACE_URI && (!lastPaneItem.isAlive || lastPaneItem.isAlive())) {
    paneItem = lastPaneItem;
  } else {
    lastPaneItem = paneItem;
  }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFFc0IsTUFBTTs7d0JBQ04sVUFBVTs7QUFLaEMsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLElBQU0sYUFBYSxHQUFHO0FBQzNCLE9BQUssRUFBRSxDQUFDO0FBQ1IsU0FBTyxFQUFFLENBQUM7QUFDVixNQUFJLEVBQUUsQ0FBQztDQUNSLENBQUE7OztBQUVNLElBQU0sYUFBYSxHQUFHO0FBQzNCLE9BQUssRUFBRSxPQUFPO0FBQ2QsU0FBTyxFQUFFLFNBQVM7QUFDbEIsTUFBSSxFQUFFLE1BQU07Q0FDYixDQUFBOztBQUNNLElBQU0sYUFBYSxHQUFHLDBCQUEwQixDQUFBOzs7O0FBRWhELFNBQVMsTUFBTSxDQUFDLE9BQXNCLEVBQVc7QUFDdEQsU0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFBO0NBQ3pFOztBQUNNLFNBQVMsS0FBSyxDQUFDLE9BQXNCLEVBQVc7QUFDckQsU0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFBO0NBQ3hFOztBQUNNLFNBQVMsYUFBYSxHQUFHO0FBQzlCLE1BQU0sU0FBUyxHQUFHLFlBQVksRUFBRSxDQUFBO0FBQ2hDLE1BQUksU0FBUyxFQUFFO0FBQ2IsUUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7R0FDM0M7Q0FDRjs7QUFDTSxTQUFTLGdCQUFnQixDQUFDLE9BQXNCLEVBQVU7QUFDL0QsU0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENB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QUFFTSxTQUFTLGFBQWEsQ0FBQyxVQUFzQixFQUFFLE9BQWMsRUFBRSxRQUFnQixFQUFXO0FBQy9GLE1BQUksUUFBUSxDQUFDLEtBQUssRUFBRTtBQUNsQixZQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDaEIsV0FBTyxJQUFJLENBQUE7R0FDWjtBQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sS0FBSyxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFBO0FBQ2hFLE1BQU0sV0FBVyxHQUFHLE9BQU8sS0FBSyxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFBO0FBQzNFLE1BQU0sV0FBVyxHQUFHLE9BQU8sS0FBSyxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFBO0FBQzNFLE1BQUksV0FBVyxFQUFFO0FBQ2YsUUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzFELFFBQUksV0FBVyxLQUFLLFdBQVcsRUFBRTtBQUMvQixhQUFPLENBQUMsSUFBSSxDQUFDLGtGQUFrRixFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0FBQ2pKLGFBQU8sS0FBSyxDQUFBO0tBQ2I7R0FDRjtBQUNELFlBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUE7QUFDbkQsU0FBTyxJQUFJLENBQUE7Q0FDWiIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7IFJhbmdlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IHNoZWxsIH0gZnJvbSAnZWxlY3Ryb24nXG5pbXBvcnQgdHlwZSB7IFBvaW50LCBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB0eXBlIEVkaXRvcnMgZnJvbSAnLi9lZGl0b3JzJ1xuaW1wb3J0IHR5cGUgeyBMaW50ZXJNZXNzYWdlIH0gZnJvbSAnLi90eXBlcydcblxubGV0IGxhc3RQYW5lSXRlbSA9IG51bGxcbmV4cG9ydCBjb25zdCBzZXZlcml0eVNjb3JlID0ge1xuICBlcnJvcjogMyxcbiAgd2FybmluZzogMixcbiAgaW5mbzogMSxcbn1cblxuZXhwb3J0IGNvbnN0IHNldmVyaXR5TmFtZXMgPSB7XG4gIGVycm9yOiAnRXJyb3InLFxuICB3YXJuaW5nOiAnV2FybmluZycsXG4gIGluZm86ICdJbmZvJyxcbn1cbmV4cG9ydCBjb25zdCBXT1JLU1BBQ0VfVVJJID0gJ2F0b206Ly9saW50ZXItdWktZGVmYXVsdCdcblxuZXhwb3J0IGZ1bmN0aW9uICRyYW5nZShtZXNzYWdlOiBMaW50ZXJNZXNzYWdlKTogP09iamVjdCB7XG4gIHJldHVybiBtZXNzYWdlLnZlcnNpb24gPT09IDEgPyBtZXNzYWdlLnJhbmdlIDogbWVzc2FnZS5sb2NhdGlvbi5wb3NpdGlvblxufVxuZXhwb3J0IGZ1bmN0aW9uICRmaWxlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UpOiA/c3RyaW5nIHtcbiAgcmV0dXJuIG1lc3NhZ2UudmVyc2lvbiA9PT0gMSA/IG1lc3NhZ2UuZmlsZVBhdGggOiBtZXNzYWdlLmxvY2F0aW9uLmZpbGVcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb3B5U2VsZWN0aW9uKCkge1xuICBjb25zdCBzZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb24oKVxuICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoc2VsZWN0aW9uLnRvU3RyaW5nKCkpXG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXRoT2ZNZXNzYWdlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UpOiBzdHJpbmcge1xuICByZXR1cm4gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKCRmaWxlKG1lc3NhZ2UpIHx8ICcnKVsxXVxufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVRleHRFZGl0b3IoKTogP1RleHRFZGl0b3Ige1xuICBsZXQgcGFuZUl0ZW0gPSBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5nZXRBY3RpdmVQYW5lSXRlbSgpXG4gIGNvbnN0IHBhbmVJc1RleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZUl0ZW0pXG4gIGlmICghcGFuZUlzVGV4dEVkaXRvciAmJiBwYW5lSXRlbSAmJiBsYXN0UGFuZUl0ZW0gJiYgcGFuZUl0ZW0uZ2V0VVJJICYmIHBhbmVJdGVtLmdldFVSSSgpID09PSBXT1JLU1BBQ0VfVVJJICYmICghbGFzdFBhbmVJdGVtLmlzQWxpdmUgfHwgbGFzdFBhbmVJdGVtLmlzQWxpdmUoKSkpIHtcbiAgICBwYW5lSXRlbSA9IGxhc3RQYW5lSXRlbVxuICB9IGVsc2Uge1xuICAgIGxhc3RQYW5lSXRlbSA9IHBhbmVJdGVtXG4gIH1cbiAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihwYW5lSXRlbSkgPyBwYW5lSXRlbSA6IG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVkaXRvcnNNYXAoZWRpdG9yczogRWRpdG9ycyk6IHsgZWRpdG9yc01hcDogT2JqZWN0LCBmaWxlUGF0aHM6IEFycmF5PHN0cmluZz4gfSB7XG4gIGNvbnN0IGVkaXRvcnNNYXAgPSB7fVxuICBjb25zdCBmaWxlUGF0aHMgPSBbXVxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVkaXRvcnMuZWRpdG9ycykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gZW50cnkudGV4dEVkaXRvci5nZXRQYXRoKClcbiAgICBpZiAoZWRpdG9yc01hcFtmaWxlUGF0aF0pIHtcbiAgICAgIGVkaXRvcnNNYXBbZmlsZVBhdGhdLmVkaXRvcnMucHVzaChlbnRyeSlcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdG9yc01hcFtmaWxlUGF0aF0gPSB7XG4gICAgICAgIGFkZGVkOiBbXSxcbiAgICAgICAgcmVtb3ZlZDogW10sXG4gICAgICAgIGVkaXRvcnM6IFtlbnRyeV0sXG4gICAgICB9XG4gICAgICBmaWxlUGF0aHMucHVzaChmaWxlUGF0aClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgZWRpdG9yc01hcCwgZmlsZVBhdGhzIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlck1lc3NhZ2VzKG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPiwgZmlsZVBhdGg6ID9zdHJpbmcsIHNldmVyaXR5OiA/c3RyaW5nID0gbnVsbCk6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3QgZmlsdGVyZWQgPSBbXVxuICBtZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBpZiAoKGZpbGVQYXRoID09PSBudWxsIHx8ICRmaWxlKG1lc3NhZ2UpID09PSBmaWxlUGF0aCkgJiYgKCFzZXZlcml0eSB8fCBtZXNzYWdlLnNldmVyaXR5ID09PSBzZXZlcml0eSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobWVzc2FnZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBmaWx0ZXJlZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTWVzc2FnZXNCeVJhbmdlT3JQb2ludChtZXNzYWdlczogU2V0PExpbnRlck1lc3NhZ2U+IHwgQXJyYXk8TGludGVyTWVzc2FnZT4sIGZpbGVQYXRoOiBzdHJpbmcsIHJhbmdlT3JQb2ludDogUG9pbnQgfCBSYW5nZSk6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3QgZmlsdGVyZWQgPSBbXVxuICBjb25zdCBleHBlY3RlZFJhbmdlID0gcmFuZ2VPclBvaW50LmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQb2ludCcgPyBuZXcgUmFuZ2UocmFuZ2VPclBvaW50LCByYW5nZU9yUG9pbnQpIDogUmFuZ2UuZnJvbU9iamVjdChyYW5nZU9yUG9pbnQpXG4gIG1lc3NhZ2VzLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnN0IGZpbGUgPSAkZmlsZShtZXNzYWdlKVxuICAgIGNvbnN0IHJhbmdlID0gJHJhbmdlKG1lc3NhZ2UpXG4gICAgaWYgKGZpbGUgJiYgcmFuZ2UgJiYgZmlsZSA9PT0gZmlsZVBhdGggJiYgcmFuZ2UuaW50ZXJzZWN0c1dpdGgoZXhwZWN0ZWRSYW5nZSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobWVzc2FnZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBmaWx0ZXJlZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkZpbGUoZmlsZTogc3RyaW5nLCBwb3NpdGlvbjogP1BvaW50KSB7XG4gIGNvbnN0IG9wdGlvbnMgPSB7fVxuICBvcHRpb25zLnNlYXJjaEFsbFBhbmVzID0gdHJ1ZVxuICBpZiAocG9zaXRpb24pIHtcbiAgICBvcHRpb25zLmluaXRpYWxMaW5lID0gcG9zaXRpb24ucm93XG4gICAgb3B0aW9ucy5pbml0aWFsQ29sdW1uID0gcG9zaXRpb24uY29sdW1uXG4gIH1cbiAgYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlLCBvcHRpb25zKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRNZXNzYWdlKG1lc3NhZ2U6IExpbnRlck1lc3NhZ2UsIHJlZmVyZW5jZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGxldCBtZXNzYWdlRmlsZVxuICBsZXQgbWVzc2FnZVBvc2l0aW9uXG4gIGlmIChyZWZlcmVuY2UpIHtcbiAgICBpZiAobWVzc2FnZS52ZXJzaW9uICE9PSAyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tMaW50ZXItVUktRGVmYXVsdF0gT25seSBtZXNzYWdlcyB2MiBhcmUgYWxsb3dlZCBpbiBqdW1wIHRvIHJlZmVyZW5jZS4gSWdub3JpbmcnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5yZWZlcmVuY2UgfHwgIW1lc3NhZ2UucmVmZXJlbmNlLmZpbGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignW0xpbnRlci1VSS1EZWZhdWx0XSBNZXNzYWdlIGRvZXMgbm90IGhhdmUgYSB2YWxpZCByZWZlcmVuY2UuIElnbm9yaW5nJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBtZXNzYWdlRmlsZSA9IG1lc3NhZ2UucmVmZXJlbmNlLmZpbGVcbiAgICBtZXNzYWdlUG9zaXRpb24gPSBtZXNzYWdlLnJlZmVyZW5jZS5wb3NpdGlvblxuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1lc3NhZ2VSYW5nZSA9ICRyYW5nZShtZXNzYWdlKVxuICAgIG1lc3NhZ2VGaWxlID0gJGZpbGUobWVzc2FnZSlcbiAgICBpZiAobWVzc2FnZVJhbmdlKSB7XG4gICAgICBtZXNzYWdlUG9zaXRpb24gPSBtZXNzYWdlUmFuZ2Uuc3RhcnRcbiAgICB9XG4gIH1cbiAgaWYgKG1lc3NhZ2VGaWxlKSB7XG4gICAgb3BlbkZpbGUobWVzc2FnZUZpbGUsIG1lc3NhZ2VQb3NpdGlvbilcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkV4dGVybmFsbHkobWVzc2FnZTogTGludGVyTWVzc2FnZSk6IHZvaWQge1xuICBpZiAobWVzc2FnZS52ZXJzaW9uID09PSAyICYmIG1lc3NhZ2UudXJsKSB7XG4gICAgc2hlbGwub3BlbkV4dGVybmFsKG1lc3NhZ2UudXJsKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0TWVzc2FnZXMoc29ydEluZm86IEFycmF5PHsgY29sdW1uOiBzdHJpbmcsIHR5cGU6ICdhc2MnIHwgJ2Rlc2MnIH0+LCByb3dzOiBBcnJheTxMaW50ZXJNZXNzYWdlPik6IEFycmF5PExpbnRlck1lc3NhZ2U+IHtcbiAgY29uc3Qgc29ydENvbHVtbnMgOiB7XG4gICAgc2V2ZXJpdHk/OiAnYXNjJyB8ICdkZXNjJyxcbiAgICBsaW50ZXJOYW1lPzogJ2FzYycgfCAnZGVzYycsXG4gICAgZmlsZT86ICdhc2MnIHwgJ2Rlc2MnLFxuICAgIGxpbmU/OiAnYXNjJyB8ICdkZXNjJ1xuICB9ID0ge31cblxuICBzb3J0SW5mby5mb3JFYWNoKGZ1bmN0aW9uKGVudHJ5KSB7XG4gICAgc29ydENvbHVtbnNbZW50cnkuY29sdW1uXSA9IGVudHJ5LnR5cGVcbiAgfSlcblxuICByZXR1cm4gcm93cy5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIGlmIChzb3J0Q29sdW1ucy5zZXZlcml0eSkge1xuICAgICAgY29uc3QgbXVsdGlwbHlXaXRoID0gc29ydENvbHVtbnMuc2V2ZXJpdHkgPT09ICdhc2MnID8gMSA6IC0xXG4gICAgICBjb25zdCBzZXZlcml0eUEgPSBzZXZlcml0eVNjb3JlW2Euc2V2ZXJpdHldXG4gICAgICBjb25zdCBzZXZlcml0eUIgPSBzZXZlcml0eVNjb3JlW2Iuc2V2ZXJpdHldXG4gICAgICBpZiAoc2V2ZXJpdHlBICE9PSBzZXZlcml0eUIpIHtcbiAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIChzZXZlcml0eUEgPiBzZXZlcml0eUIgPyAxIDogLTEpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzb3J0Q29sdW1ucy5saW50ZXJOYW1lKSB7XG4gICAgICBjb25zdCBtdWx0aXBseVdpdGggPSBzb3J0Q29sdW1ucy5saW50ZXJOYW1lID09PSAnYXNjJyA/IDEgOiAtMVxuICAgICAgY29uc3Qgc29ydFZhbHVlID0gYS5zZXZlcml0eS5sb2NhbGVDb21wYXJlKGIuc2V2ZXJpdHkpXG4gICAgICBpZiAoc29ydFZhbHVlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiBzb3J0VmFsdWVcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNvcnRDb2x1bW5zLmZpbGUpIHtcbiAgICAgIGNvbnN0IG11bHRpcGx5V2l0aCA9IHNvcnRDb2x1bW5zLmZpbGUgPT09ICdhc2MnID8gMSA6IC0xXG4gICAgICBjb25zdCBmaWxlQSA9IGdldFBhdGhPZk1lc3NhZ2UoYSlcbiAgICAgIGNvbnN0IGZpbGVBTGVuZ3RoID0gZmlsZUEubGVuZ3RoXG4gICAgICBjb25zdCBmaWxlQiA9IGdldFBhdGhPZk1lc3NhZ2UoYilcbiAgICAgIGNvbnN0IGZpbGVCTGVuZ3RoID0gZmlsZUIubGVuZ3RoXG4gICAgICBpZiAoZmlsZUFMZW5ndGggIT09IGZpbGVCTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiAoZmlsZUFMZW5ndGggPiBmaWxlQkxlbmd0aCA/IDEgOiAtMSlcbiAgICAgIH0gZWxzZSBpZiAoZmlsZUEgIT09IGZpbGVCKSB7XG4gICAgICAgIHJldHVybiBtdWx0aXBseVdpdGggKiBmaWxlQS5sb2NhbGVDb21wYXJlKGZpbGVCKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc29ydENvbHVtbnMubGluZSkge1xuICAgICAgY29uc3QgbXVsdGlwbHlXaXRoID0gc29ydENvbHVtbnMubGluZSA9PT0gJ2FzYycgPyAxIDogLTFcbiAgICAgIGNvbnN0IHJhbmdlQSA9ICRyYW5nZShhKVxuICAgICAgY29uc3QgcmFuZ2VCID0gJHJhbmdlKGIpXG4gICAgICBpZiAocmFuZ2VBICYmICFyYW5nZUIpIHtcbiAgICAgICAgcmV0dXJuIDFcbiAgICAgIH0gZWxzZSBpZiAocmFuZ2VCICYmICFyYW5nZUEpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9IGVsc2UgaWYgKHJhbmdlQSAmJiByYW5nZUIpIHtcbiAgICAgICAgaWYgKHJhbmdlQS5zdGFydC5yb3cgIT09IHJhbmdlQi5zdGFydC5yb3cpIHtcbiAgICAgICAgICByZXR1cm4gbXVsdGlwbHlXaXRoICogKHJhbmdlQS5zdGFydC5yb3cgPiByYW5nZUIuc3RhcnQucm93ID8gMSA6IC0xKVxuICAgICAgICB9XG4gICAgICAgIGlmIChyYW5nZUEuc3RhcnQuY29sdW1uICE9PSByYW5nZUIuc3RhcnQuY29sdW1uKSB7XG4gICAgICAgICAgcmV0dXJuIG11bHRpcGx5V2l0aCAqIChyYW5nZUEuc3RhcnQuY29sdW1uID4gcmFuZ2VCLnN0YXJ0LmNvbHVtbiA/IDEgOiAtMSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAwXG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0U29sdXRpb25zKHNvbHV0aW9uczogQXJyYXk8T2JqZWN0Pik6IEFycmF5PE9iamVjdD4ge1xuICByZXR1cm4gc29sdXRpb25zLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGIucHJpb3JpdHkgLSBhLnByaW9yaXR5XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVNvbHV0aW9uKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHZlcnNpb246IDEgfCAyLCBzb2x1dGlvbjogT2JqZWN0KTogYm9vbGVhbiB7XG4gIGlmIChzb2x1dGlvbi5hcHBseSkge1xuICAgIHNvbHV0aW9uLmFwcGx5KClcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IHJhbmdlID0gdmVyc2lvbiA9PT0gMSA/IHNvbHV0aW9uLnJhbmdlIDogc29sdXRpb24ucG9zaXRpb25cbiAgY29uc3QgY3VycmVudFRleHQgPSB2ZXJzaW9uID09PSAxID8gc29sdXRpb24ub2xkVGV4dCA6IHNvbHV0aW9uLmN1cnJlbnRUZXh0XG4gIGNvbnN0IHJlcGxhY2VXaXRoID0gdmVyc2lvbiA9PT0gMSA/IHNvbHV0aW9uLm5ld1RleHQgOiBzb2x1dGlvbi5yZXBsYWNlV2l0aFxuICBpZiAoY3VycmVudFRleHQpIHtcbiAgICBjb25zdCB0ZXh0SW5SYW5nZSA9IHRleHRFZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgaWYgKGN1cnJlbnRUZXh0ICE9PSB0ZXh0SW5SYW5nZSkge1xuICAgICAgY29uc29sZS53YXJuKCdbbGludGVyLXVpLWRlZmF1bHRdIE5vdCBhcHBseWluZyBmaXggYmVjYXVzZSB0ZXh0IGRpZCBub3QgbWF0Y2ggdGhlIGV4cGVjdGVkIG9uZScsICdleHBlY3RlZCcsIGN1cnJlbnRUZXh0LCAnYnV0IGdvdCcsIHRleHRJblJhbmdlKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHRleHRFZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsIHJlcGxhY2VXaXRoKVxuICByZXR1cm4gdHJ1ZVxufVxuIl19