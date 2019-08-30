var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _atomTernjsView = require('./atom-ternjs-view');

var _atomTernjsView2 = _interopRequireDefault(_atomTernjsView);

'use babel';

var RenameView = (function (_TernView) {
  _inherits(RenameView, _TernView);

  function RenameView() {
    _classCallCheck(this, RenameView);

    _get(Object.getPrototypeOf(RenameView.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(RenameView, [{
    key: 'createdCallback',
    value: function createdCallback() {

      this.classList.add('atom-ternjs-rename');

      var container = document.createElement('div');
      var wrapper = document.createElement('div');

      var title = document.createElement('h1');
      title.innerHTML = 'Rename';

      var sub = document.createElement('h2');
      sub.innerHTML = 'Rename a variable in a scope-aware way. (experimental)';

      this.nameEditor = document.createElement('atom-text-editor');
      this.nameEditor.setAttribute('mini', true);
      this.nameEditor.addEventListener('core:confirm', this.rename.bind(this));

      var buttonRename = document.createElement('button');
      buttonRename.innerHTML = 'Rename';
      buttonRename.id = 'rename';
      buttonRename.classList.add('btn');
      buttonRename.classList.add('btn-default');
      buttonRename.classList.add('mt');
      buttonRename.addEventListener('click', this.rename.bind(this));

      wrapper.appendChild(title);
      wrapper.appendChild(sub);
      wrapper.appendChild(this.nameEditor);
      wrapper.appendChild(buttonRename);
      container.appendChild(wrapper);

      this.appendChild(container);
    }
  }, {
    key: 'rename',
    value: function rename() {

      var text = this.nameEditor.getModel().getBuffer().getText();

      if (!text) {

        return;
      }

      this.model.updateAllAndRename(text);
    }
  }]);

  return RenameView;
})(_atomTernjsView2['default']);

module.exports = document.registerElement('atom-ternjs-rename', {

  prototype: RenameView.prototype
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1yZW5hbWUtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OzhCQUVxQixvQkFBb0I7Ozs7QUFGekMsV0FBVyxDQUFDOztJQUlOLFVBQVU7WUFBVixVQUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7O2VBQVYsVUFBVTs7V0FFQywyQkFBRzs7QUFFaEIsVUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQzs7QUFFekMsVUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoRCxVQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUU5QyxVQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pDLFdBQUssQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDOztBQUUzQixVQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLFNBQUcsQ0FBQyxTQUFTLEdBQUcsd0RBQXdELENBQUM7O0FBRXpFLFVBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQzdELFVBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMzQyxVQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQUV6RSxVQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BELGtCQUFZLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztBQUNsQyxrQkFBWSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUM7QUFDM0Isa0JBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xDLGtCQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMxQyxrQkFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsa0JBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFL0QsYUFBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQixhQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLGFBQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLGFBQU8sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbEMsZUFBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFL0IsVUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUM3Qjs7O1dBRUssa0JBQUc7O0FBRVAsVUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFOUQsVUFBSSxDQUFDLElBQUksRUFBRTs7QUFFVCxlQUFPO09BQ1I7O0FBRUQsVUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQzs7O1NBOUNHLFVBQVU7OztBQWlEaEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLG9CQUFvQixFQUFFOztBQUU5RCxXQUFTLEVBQUUsVUFBVSxDQUFDLFNBQVM7Q0FDaEMsQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1yZW5hbWUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgVGVyblZpZXcgZnJvbSAnLi9hdG9tLXRlcm5qcy12aWV3JztcblxuY2xhc3MgUmVuYW1lVmlldyBleHRlbmRzIFRlcm5WaWV3IHtcblxuICBjcmVhdGVkQ2FsbGJhY2soKSB7XG5cbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2F0b20tdGVybmpzLXJlbmFtZScpO1xuXG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgbGV0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgICB0aXRsZS5pbm5lckhUTUwgPSAnUmVuYW1lJztcblxuICAgIGxldCBzdWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuICAgIHN1Yi5pbm5lckhUTUwgPSAnUmVuYW1lIGEgdmFyaWFibGUgaW4gYSBzY29wZS1hd2FyZSB3YXkuIChleHBlcmltZW50YWwpJztcblxuICAgIHRoaXMubmFtZUVkaXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20tdGV4dC1lZGl0b3InKTtcbiAgICB0aGlzLm5hbWVFZGl0b3Iuc2V0QXR0cmlidXRlKCdtaW5pJywgdHJ1ZSk7XG4gICAgdGhpcy5uYW1lRWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NvcmU6Y29uZmlybScsIHRoaXMucmVuYW1lLmJpbmQodGhpcykpO1xuXG4gICAgbGV0IGJ1dHRvblJlbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvblJlbmFtZS5pbm5lckhUTUwgPSAnUmVuYW1lJztcbiAgICBidXR0b25SZW5hbWUuaWQgPSAncmVuYW1lJztcbiAgICBidXR0b25SZW5hbWUuY2xhc3NMaXN0LmFkZCgnYnRuJyk7XG4gICAgYnV0dG9uUmVuYW1lLmNsYXNzTGlzdC5hZGQoJ2J0bi1kZWZhdWx0Jyk7XG4gICAgYnV0dG9uUmVuYW1lLmNsYXNzTGlzdC5hZGQoJ210Jyk7XG4gICAgYnV0dG9uUmVuYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5yZW5hbWUuYmluZCh0aGlzKSk7XG5cbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKHN1Yik7XG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLm5hbWVFZGl0b3IpO1xuICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoYnV0dG9uUmVuYW1lKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG5cbiAgICB0aGlzLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gIH1cblxuICByZW5hbWUoKSB7XG5cbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5uYW1lRWRpdG9yLmdldE1vZGVsKCkuZ2V0QnVmZmVyKCkuZ2V0VGV4dCgpO1xuXG4gICAgaWYgKCF0ZXh0KSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLm1vZGVsLnVwZGF0ZUFsbEFuZFJlbmFtZSh0ZXh0KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnYXRvbS10ZXJuanMtcmVuYW1lJywge1xuXG4gIHByb3RvdHlwZTogUmVuYW1lVmlldy5wcm90b3R5cGVcbn0pO1xuIl19