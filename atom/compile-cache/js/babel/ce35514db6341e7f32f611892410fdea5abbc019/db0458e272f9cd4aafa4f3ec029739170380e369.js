var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('./helpers');

var Helpers = _interopRequireWildcard(_helpers);

var Element = (function () {
  function Element() {
    var _this = this;

    _classCallCheck(this, Element);

    this.item = document.createElement('div');
    this.itemErrors = Helpers.getElement('stop');
    this.itemWarnings = Helpers.getElement('alert');
    this.itemInfos = Helpers.getElement('info');

    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();

    this.item.appendChild(this.itemErrors);
    this.item.appendChild(this.itemWarnings);
    this.item.appendChild(this.itemInfos);
    this.item.classList.add('inline-block');
    this.item.classList.add('linter-status-count');

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(atom.tooltips.add(this.itemErrors, { title: 'Linter Errors' }));
    this.subscriptions.add(atom.tooltips.add(this.itemWarnings, { title: 'Linter Warnings' }));
    this.subscriptions.add(atom.tooltips.add(this.itemInfos, { title: 'Linter Infos' }));

    this.itemErrors.onclick = function () {
      return _this.emitter.emit('click', 'error');
    };
    this.itemWarnings.onclick = function () {
      return _this.emitter.emit('click', 'warning');
    };
    this.itemInfos.onclick = function () {
      return _this.emitter.emit('click', 'info');
    };

    this.update(0, 0, 0);
  }

  _createClass(Element, [{
    key: 'setVisibility',
    value: function setVisibility(prefix, visibility) {
      if (visibility) {
        this.item.classList.remove('hide-' + prefix);
      } else {
        this.item.classList.add('hide-' + prefix);
      }
    }
  }, {
    key: 'update',
    value: function update(countErrors, countWarnings, countInfos) {
      this.itemErrors.childNodes[0].textContent = String(countErrors);
      this.itemWarnings.childNodes[0].textContent = String(countWarnings);
      this.itemInfos.childNodes[0].textContent = String(countInfos);

      if (countErrors) {
        this.itemErrors.classList.add('text-error');
      } else {
        this.itemErrors.classList.remove('text-error');
      }

      if (countWarnings) {
        this.itemWarnings.classList.add('text-warning');
      } else {
        this.itemWarnings.classList.remove('text-warning');
      }

      if (countInfos) {
        this.itemInfos.classList.add('text-info');
      } else {
        this.itemInfos.classList.remove('text-info');
      }
    }
  }, {
    key: 'onDidClick',
    value: function onDidClick(callback) {
      return this.emitter.on('click', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return Element;
})();

module.exports = Element;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3N0YXR1cy1iYXIvZWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7b0JBRTZDLE1BQU07O3VCQUcxQixXQUFXOztJQUF4QixPQUFPOztJQUViLE9BQU87QUFTQSxXQVRQLE9BQU8sR0FTRzs7OzBCQVRWLE9BQU87O0FBVVQsUUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3pDLFFBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUM1QyxRQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDL0MsUUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBOztBQUUzQyxRQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFhLENBQUE7QUFDNUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ3RDLFFBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUN4QyxRQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDckMsUUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQ3ZDLFFBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFD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QyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDMUM7OztXQUNNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUM3Qjs7O1NBdEVHLE9BQU87OztBQXlFYixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9zdGF0dXMtYmFyL2VsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB0eXBlIHsgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCAqIGFzIEhlbHBlcnMgZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBFbGVtZW50IHtcbiAgaXRlbTogSFRNTEVsZW1lbnQ7XG4gIGl0ZW1FcnJvcnM6IEhUTUxFbGVtZW50O1xuICBpdGVtV2FybmluZ3M6IEhUTUxFbGVtZW50O1xuICBpdGVtSW5mb3M6IEhUTUxFbGVtZW50O1xuXG4gIGVtaXR0ZXI6IEVtaXR0ZXI7XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLml0ZW1FcnJvcnMgPSBIZWxwZXJzLmdldEVsZW1lbnQoJ3N0b3AnKVxuICAgIHRoaXMuaXRlbVdhcm5pbmdzID0gSGVscGVycy5nZXRFbGVtZW50KCdhbGVydCcpXG4gICAgdGhpcy5pdGVtSW5mb3MgPSBIZWxwZXJzLmdldEVsZW1lbnQoJ2luZm8nKVxuXG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuaXRlbS5hcHBlbmRDaGlsZCh0aGlzLml0ZW1FcnJvcnMpXG4gICAgdGhpcy5pdGVtLmFwcGVuZENoaWxkKHRoaXMuaXRlbVdhcm5pbmdzKVxuICAgIHRoaXMuaXRlbS5hcHBlbmRDaGlsZCh0aGlzLml0ZW1JbmZvcylcbiAgICB0aGlzLml0ZW0uY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJylcbiAgICB0aGlzLml0ZW0uY2xhc3NMaXN0LmFkZCgnbGludGVyLXN0YXR1cy1jb3VudCcpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZW1pdHRlcilcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20udG9vbHRpcHMuYWRkKHRoaXMuaXRlbUVycm9ycywgeyB0aXRsZTogJ0xpbnRlciBFcnJvcnMnIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS50b29sdGlwcy5hZGQodGhpcy5pdGVtV2FybmluZ3MsIHsgdGl0bGU6ICdMaW50ZXIgV2FybmluZ3MnIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS50b29sdGlwcy5hZGQodGhpcy5pdGVtSW5mb3MsIHsgdGl0bGU6ICdMaW50ZXIgSW5mb3MnIH0pKVxuXG4gICAgdGhpcy5pdGVtRXJyb3JzLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgnY2xpY2snLCAnZXJyb3InKVxuICAgIHRoaXMuaXRlbVdhcm5pbmdzLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgnY2xpY2snLCAnd2FybmluZycpXG4gICAgdGhpcy5pdGVtSW5mb3Mub25jbGljayA9ICgpID0+IHRoaXMuZW1pdHRlci5lbWl0KCdjbGljaycsICdpbmZvJylcblxuICAgIHRoaXMudXBkYXRlKDAsIDAsIDApXG4gIH1cbiAgc2V0VmlzaWJpbGl0eShwcmVmaXg6IHN0cmluZywgdmlzaWJpbGl0eTogYm9vbGVhbikge1xuICAgIGlmICh2aXNpYmlsaXR5KSB7XG4gICAgICB0aGlzLml0ZW0uY2xhc3NMaXN0LnJlbW92ZShgaGlkZS0ke3ByZWZpeH1gKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLml0ZW0uY2xhc3NMaXN0LmFkZChgaGlkZS0ke3ByZWZpeH1gKVxuICAgIH1cbiAgfVxuICB1cGRhdGUoY291bnRFcnJvcnM6IG51bWJlciwgY291bnRXYXJuaW5nczogbnVtYmVyLCBjb3VudEluZm9zOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1FcnJvcnMuY2hpbGROb2Rlc1swXS50ZXh0Q29udGVudCA9IFN0cmluZyhjb3VudEVycm9ycylcbiAgICB0aGlzLml0ZW1XYXJuaW5ncy5jaGlsZE5vZGVzWzBdLnRleHRDb250ZW50ID0gU3RyaW5nKGNvdW50V2FybmluZ3MpXG4gICAgdGhpcy5pdGVtSW5mb3MuY2hpbGROb2Rlc1swXS50ZXh0Q29udGVudCA9IFN0cmluZyhjb3VudEluZm9zKVxuXG4gICAgaWYgKGNvdW50RXJyb3JzKSB7XG4gICAgICB0aGlzLml0ZW1FcnJvcnMuY2xhc3NMaXN0LmFkZCgndGV4dC1lcnJvcicpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaXRlbUVycm9ycy5jbGFzc0xpc3QucmVtb3ZlKCd0ZXh0LWVycm9yJylcbiAgICB9XG5cbiAgICBpZiAoY291bnRXYXJuaW5ncykge1xuICAgICAgdGhpcy5pdGVtV2FybmluZ3MuY2xhc3NMaXN0LmFkZCgndGV4dC13YXJuaW5nJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pdGVtV2FybmluZ3MuY2xhc3NMaXN0LnJlbW92ZSgndGV4dC13YXJuaW5nJylcbiAgICB9XG5cbiAgICBpZiAoY291bnRJbmZvcykge1xuICAgICAgdGhpcy5pdGVtSW5mb3MuY2xhc3NMaXN0LmFkZCgndGV4dC1pbmZvJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pdGVtSW5mb3MuY2xhc3NMaXN0LnJlbW92ZSgndGV4dC1pbmZvJylcbiAgICB9XG4gIH1cbiAgb25EaWRDbGljayhjYWxsYmFjazogKCh0eXBlOiBzdHJpbmcpID0+IHZvaWQpKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignY2xpY2snLCBjYWxsYmFjaylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVsZW1lbnRcbiJdfQ==