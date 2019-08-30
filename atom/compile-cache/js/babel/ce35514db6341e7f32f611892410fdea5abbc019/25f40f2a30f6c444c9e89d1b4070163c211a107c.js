Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _validate = require('./validate');

var Validate = _interopRequireWildcard(_validate);

var _helpers = require('./helpers');

var IndieDelegate = (function () {
  function IndieDelegate(indie, version) {
    _classCallCheck(this, IndieDelegate);

    this.indie = indie;
    this.scope = 'project';
    this.version = version;
    this.emitter = new _atom.Emitter();
    this.messages = new Map();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
  }

  _createClass(IndieDelegate, [{
    key: 'getMessages',
    value: function getMessages() {
      return Array.from(this.messages.values()).reduce(function (toReturn, entry) {
        return toReturn.concat(entry);
      }, []);
    }
  }, {
    key: 'clearMessages',
    value: function clearMessages() {
      if (!this.subscriptions.disposed) {
        this.emitter.emit('did-update', []);
        this.messages.clear();
      }
    }
  }, {
    key: 'setMessages',
    value: function setMessages(filePath) {
      var messages = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      // v2 Support from here on
      if (typeof filePath !== 'string' || !Array.isArray(messages)) {
        throw new Error('Invalid Parameters to setMessages()');
      }
      if (this.subscriptions.disposed || !Validate.messages(this.name, messages)) {
        return;
      }
      messages.forEach(function (message) {
        if (message.location.file !== filePath) {
          console.debug('[Linter-UI-Default] Expected File', filePath, 'Message', message);
          throw new Error('message.location.file does not match the given filePath');
        }
      });

      (0, _helpers.normalizeMessages)(this.name, messages);
      this.messages.set(filePath, messages);
      this.emitter.emit('did-update', this.getMessages());
    }
  }, {
    key: 'setAllMessages',
    value: function setAllMessages(messages) {
      if (this.subscriptions.disposed) {
        return;
      }

      if (atom.inDevMode() || !Array.isArray(messages)) {
        if (!Validate.messages(this.name, messages)) return;
      }
      (0, _helpers.normalizeMessages)(this.name, messages);

      this.messages.clear();
      for (var i = 0, _length = messages.length; i < _length; ++i) {
        var message = messages[i];
        var filePath = message.location.file;
        var fileMessages = this.messages.get(filePath);
        if (!fileMessages) {
          this.messages.set(filePath, fileMessages = []);
        }
        fileMessages.push(message);
      }
      this.emitter.emit('did-update', this.getMessages());
    }
  }, {
    key: 'onDidUpdate',
    value: function onDidUpdate(callback) {
      return this.emitter.on('did-update', callback);
    }
  }, {
    key: 'onDidDestroy',
    value: function onDidDestroy(callback) {
      return this.emitter.on('did-destroy', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-destroy');
      this.subscriptions.dispose();
      this.messages.clear();
    }
  }, {
    key: 'name',
    get: function get() {
      return this.indie.name;
    }
  }]);

  return IndieDelegate;
})();

exports['default'] = IndieDelegate;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9pbmRpZS1kZWxlZ2F0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUU2QyxNQUFNOzt3QkFHekIsWUFBWTs7SUFBMUIsUUFBUTs7dUJBQ2MsV0FBVzs7SUFHeEIsYUFBYTtBQVFyQixXQVJRLGFBQWEsQ0FRcEIsS0FBWSxFQUFFLE9BQVUsRUFBRTswQkFSbkIsYUFBYTs7QUFTOUIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7QUFDbEIsUUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUE7QUFDdEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7QUFDdEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUN6QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7R0FDckM7O2VBakJrQixhQUFhOztXQXFCckIsdUJBQW1CO0FBQzVCLGFBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVMsUUFBUSxFQUFFLEtBQUssRUFBRTtBQUN6RSxlQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7T0FDOUIsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUNQOzs7V0FDWSx5QkFBUztBQUNwQixVQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUU7QUFDaEMsWUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQ25DLFlBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7T0FDdEI7S0FDRjs7O1dBQ1UscUJBQUMsUUFBZ0MsRUFBeUM7VUFBdkMsUUFBd0IseURBQUcsSUFBSTs7O0FBRTNFLFVBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM1RCxjQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7T0FDdkQ7QUFDRCxVQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFO0FBQzFFLGVBQU07T0FDUDtBQUNELGNBQVEsQ0FBQyxPQUFPLENBQUMsVUFBUyxPQUFPLEVBQUU7QUFDakMsWUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDdEMsaUJBQU8sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUNoRixnQkFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFBO1NBQzNFO09BQ0YsQ0FBQyxDQUFBOztBQUVGLHNDQUFrQixJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0FBQ3RDLFVBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtBQUNyQyxVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUE7S0FDcEQ7OztXQUNhLHdCQUFDLFFBQXVCLEVBQVE7QUFDNUMsVUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRTtBQUMvQixlQUFNO09BQ1A7O0FBRUQsVUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2hELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsT0FBTTtPQUNwRDtBQUNELHNDQUFrQixJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFBOztBQUV0QyxVQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ3JCLGVBQVMsQ0FBQyxHQUFHLENBQUMsRUFBSSxPQUFNLEdBQUssUUFBUSxDQUFuQixNQUFNLEVBQWUsQ0FBQyxHQUFHLE9BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtBQUN0RCxZQUFNLE9BQWdCLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3BDLFlBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFBO0FBQ3RDLFlBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzlDLFlBQUksQ0FBQyxZQUFZLEVBQUU7QUFDakIsY0FBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFHLFlBQVksR0FBRyxFQUFFLENBQUUsQ0FBQTtTQUNqRDtBQUNELG9CQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO09BQzNCO0FBQ0QsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFBO0tBQ3BEOzs7V0FDVSxxQkFBQyxRQUFrQixFQUFjO0FBQzFDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQy9DOzs7V0FDVyxzQkFBQyxRQUFrQixFQUFjO0FBQzNDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQ2hEOzs7V0FDTSxtQkFBUztBQUNkLFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ2hDLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDNUIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtLQUN0Qjs7O1NBakVPLGVBQVc7QUFDakIsYUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQTtLQUN2Qjs7O1NBcEJrQixhQUFhOzs7cUJBQWIsYUFBYSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci9saWIvaW5kaWUtZGVsZWdhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB0eXBlIHsgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCAqIGFzIFZhbGlkYXRlIGZyb20gJy4vdmFsaWRhdGUnXG5pbXBvcnQgeyBub3JtYWxpemVNZXNzYWdlcyB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgSW5kaWUsIE1lc3NhZ2UgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbmRpZURlbGVnYXRlIHtcbiAgaW5kaWU6IEluZGllXG4gIHNjb3BlOiAncHJvamVjdCdcbiAgZW1pdHRlcjogRW1pdHRlclxuICB2ZXJzaW9uOiAyXG4gIG1lc3NhZ2VzOiBNYXA8P3N0cmluZywgQXJyYXk8TWVzc2FnZT4+XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICBjb25zdHJ1Y3RvcihpbmRpZTogSW5kaWUsIHZlcnNpb246IDIpIHtcbiAgICB0aGlzLmluZGllID0gaW5kaWVcbiAgICB0aGlzLnNjb3BlID0gJ3Byb2plY3QnXG4gICAgdGhpcy52ZXJzaW9uID0gdmVyc2lvblxuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLm1lc3NhZ2VzID0gbmV3IE1hcCgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpXG4gIH1cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5pbmRpZS5uYW1lXG4gIH1cbiAgZ2V0TWVzc2FnZXMoKTogQXJyYXk8TWVzc2FnZT4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMubWVzc2FnZXMudmFsdWVzKCkpLnJlZHVjZShmdW5jdGlvbih0b1JldHVybiwgZW50cnkpIHtcbiAgICAgIHJldHVybiB0b1JldHVybi5jb25jYXQoZW50cnkpXG4gICAgfSwgW10pXG4gIH1cbiAgY2xlYXJNZXNzYWdlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlZCkge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC11cGRhdGUnLCBbXSlcbiAgICAgIHRoaXMubWVzc2FnZXMuY2xlYXIoKVxuICAgIH1cbiAgfVxuICBzZXRNZXNzYWdlcyhmaWxlUGF0aDogc3RyaW5nIHwgQXJyYXk8T2JqZWN0PiwgbWVzc2FnZXM6ID9BcnJheTxPYmplY3Q+ID0gbnVsbCk6IHZvaWQge1xuICAgIC8vIHYyIFN1cHBvcnQgZnJvbSBoZXJlIG9uXG4gICAgaWYgKHR5cGVvZiBmaWxlUGF0aCAhPT0gJ3N0cmluZycgfHwgIUFycmF5LmlzQXJyYXkobWVzc2FnZXMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgUGFyYW1ldGVycyB0byBzZXRNZXNzYWdlcygpJylcbiAgICB9XG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlZCB8fCAhVmFsaWRhdGUubWVzc2FnZXModGhpcy5uYW1lLCBtZXNzYWdlcykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBtZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIGlmIChtZXNzYWdlLmxvY2F0aW9uLmZpbGUgIT09IGZpbGVQYXRoKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tMaW50ZXItVUktRGVmYXVsdF0gRXhwZWN0ZWQgRmlsZScsIGZpbGVQYXRoLCAnTWVzc2FnZScsIG1lc3NhZ2UpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbWVzc2FnZS5sb2NhdGlvbi5maWxlIGRvZXMgbm90IG1hdGNoIHRoZSBnaXZlbiBmaWxlUGF0aCcpXG4gICAgICB9XG4gICAgfSlcblxuICAgIG5vcm1hbGl6ZU1lc3NhZ2VzKHRoaXMubmFtZSwgbWVzc2FnZXMpXG4gICAgdGhpcy5tZXNzYWdlcy5zZXQoZmlsZVBhdGgsIG1lc3NhZ2VzKVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtdXBkYXRlJywgdGhpcy5nZXRNZXNzYWdlcygpKVxuICB9XG4gIHNldEFsbE1lc3NhZ2VzKG1lc3NhZ2VzOiBBcnJheTxPYmplY3Q+KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGF0b20uaW5EZXZNb2RlKCkgfHwgIUFycmF5LmlzQXJyYXkobWVzc2FnZXMpKSB7XG4gICAgICBpZiAoIVZhbGlkYXRlLm1lc3NhZ2VzKHRoaXMubmFtZSwgbWVzc2FnZXMpKSByZXR1cm5cbiAgICB9XG4gICAgbm9ybWFsaXplTWVzc2FnZXModGhpcy5uYW1lLCBtZXNzYWdlcylcblxuICAgIHRoaXMubWVzc2FnZXMuY2xlYXIoKVxuICAgIGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gbWVzc2FnZXM7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgY29uc3QgbWVzc2FnZTogTWVzc2FnZSA9IG1lc3NhZ2VzW2ldXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IG1lc3NhZ2UubG9jYXRpb24uZmlsZVxuICAgICAgbGV0IGZpbGVNZXNzYWdlcyA9IHRoaXMubWVzc2FnZXMuZ2V0KGZpbGVQYXRoKVxuICAgICAgaWYgKCFmaWxlTWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5zZXQoZmlsZVBhdGgsIChmaWxlTWVzc2FnZXMgPSBbXSkpXG4gICAgICB9XG4gICAgICBmaWxlTWVzc2FnZXMucHVzaChtZXNzYWdlKVxuICAgIH1cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXVwZGF0ZScsIHRoaXMuZ2V0TWVzc2FnZXMoKSlcbiAgfVxuICBvbkRpZFVwZGF0ZShjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtdXBkYXRlJywgY2FsbGJhY2spXG4gIH1cbiAgb25EaWREZXN0cm95KGNhbGxiYWNrOiBGdW5jdGlvbik6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1kZXN0cm95JywgY2FsbGJhY2spXG4gIH1cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWRlc3Ryb3knKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB0aGlzLm1lc3NhZ2VzLmNsZWFyKClcbiAgfVxufVxuIl19