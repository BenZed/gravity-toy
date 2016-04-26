export default class extends React.Component {

  constructor(props) {
    super(props);
    this.style = {
      opacity: 0,
      color: '#00FF00',
      position: 'absolute',
      left: 25,
      top: 25
    }
  }

  calcStyle() {

    this.style.opacity += (this.props.speed == 100 ? -0.05 : 0.05);
    this.style.opacity = this.style.opacity < 0 ? 0 : this.style.opacity > 1 ? 1 : this.style.opacity;
    this.style.color = '#00FF00';

    if (this.props.speed < 10)
      this.style.color = "#FFFF00";

    if (this.props.speed < 1)
      this.style.color = "#FFAA00";

    if (this.props.speed < 0.1)
      this.style.color = "#FF2200";

    if (this.props.speed < 0.01)
      this.style.color = "#FF0000";
    
    return this.style;
  }

  qualityString() {
    var pipes = ""
    var i = 100;
    while (i > this.props.speed) {
        i -= 2.5;
        pipes += "|";
    }
    return pipes;
  }

  render() {
    return <span style={this.calcStyle()} className='glyphicon glyphicon-hourglass'>
        <strong>{this.qualityString()}</strong>
      </span>
  }
}