//Dependencies
import is from 'is-explicit';

//Dependencies
import geometry from "../modules/geometry2D";
import actions from "../modules/mouse-actions";
import Simulation from "../modules/simulation";
import SimulationDraw2D from "../modules/simulation-draw-2D";


//Components
import Speedometer from "./Speedometer";

//Types
const Vector = geometry.Vector;

module.exports = class GravityUI extends React.Component {

  constructor(props) {
    super(props);

    this.simulation = new Simulation;
    this.draw = new SimulationDraw2D(this.simulation, props.canvas);

    this.simulation.on('body-create', (body) => {
      var name = Math.random().toString(36).substring(2,8).toUpperCase();
      body.name = name.slice(0,3) + "-" + name.slice(3);
    });

    this.simulation.on('interval-complete', (dt, speed) => { 

      speed = Math.round(speed * 1000) / 10;

      if (this.input.mousePressing && is(this.input.mouseAction.hold, Function))
        this.input.mouseAction.hold(this.input);

      this.setState({
        speed,
        bodyCount: this.simulation.bodies.length 
      });
    });

    this.state = { 
      speed: 0, 
      bodyCount: 0 
    };

    this.input = {
      mouseOrigin: Vector.zero,
      mouseEnd: Vector.zero,
      mousePressing: false,
      mouseAction: {}
    };

    this.createInitialBodies();
    this.simulation.start();
  }

  createNebula(radius, offset, turbulence) {
    turbulence = turbulence == null ? 20 : turbulence;
    offset = offset == null ? Vector.zero : offset;
    var total = 0;

    while (total < radius * 1.5) {

      var cloudOffset = Vector.randomInCircle(radius);
      var cloudRadius = Math.random() * (radius * 0.5);
      var count = cloudRadius * 0.2;

      for (var i = 0; i < count; i++) {
        var mass = Math.random() * 10000 + 100;
        var vec = Vector.randomInCircle(turbulence);
        var pos = Vector.randomInCircle(cloudRadius).add(cloudOffset).add(offset);
        this.simulation.createBody(mass, pos, vec);
        total++;
      }
    }
  }

  createInitialBodies() {
    // this.createNebula(1000, new Vector(6000,1250));
    // this.createNebula(200, new Vector(-3000,50), 50);
    // this.createNebula(500, new Vector(-1000,3500), 50);
    // var canvas = this.draw.canvas;
    var windowCenter = new Vector(canvas.width * 0.5, canvas.height * 0.5)
    this.createNebula(500, windowCenter);
  }

  componentDidMount() {
    window.addEventListener('wheel', e => this.handleTouch(e));
    this.draw.canvas.addEventListener('mousedown', e => this.handlePress(e));
    this.draw.canvas.addEventListener('mousemove', e => this.handleMove(e));
    this.draw.canvas.addEventListener('mouseup', e => this.handleRelease(e));
  }

  handleTouch(event) {
    event.stopPropagation();
    event.returnValue = false;

    let delta = new Vector(event.deltaX, event.deltaY);

    if (!event.shiftKey) {
      let scale = Math.min(this.draw.camera.target.scale, 50);
      let zoomSpeed = scale * 0.001;
      let sign = delta.y > 0 ? 1 : -1;

      this.draw.camera.target.scale += delta.magnitude * zoomSpeed * sign;

    } else {
      let translateSpeed = this.draw.camera.target.scale * 0.2;
      delta.imult(translateSpeed);

      this.draw.camera.target.pos.iadd(delta);
    }
  }

  handlePress(event) {
    this.input.mouseOrigin.x = event.clientX;
    this.input.mouseOrigin.y = event.clientY;
    this.input.mouseEnd.x = event.clientX;
    this.input.mouseEnd.y = event.clientY;
    this.input.mousePressing = true;

    if (is(this.input.mouseAction.press, Function))
      this.input.mouseAction.press(this.input)
  }

  handleMove(event) {
    if (!this.input.mousePressing)
      return;

    this.input.mouseEnd.x = event.clientX;
    this.input.mouseEnd.y = event.clientY;
  }

  handleRelease(event) {
    this.input.mousePressing = false;

    if (is(this.input.mouseAction.release, Function))
      this.input.mouseAction.release(this.input);
  }

  changeActionButton(e) {
    
    name = e.target.dataset.action;

    if (actions[name])
      this.input.mouseAction = new actions[name](this);
  }

  render() {

    let changeActionButton = this.changeActionButton.bind(this);

    return <div className="container">
        <div className="row">
          <div className="col-sm-3">
            <h1 className='text-'>Gravity Toy</h1>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-1">
            <button className="btn btn-primary" onClick={changeActionButton} data-action="CreateBody">Create</button>
          </div>
          <div className="col-sm-1">
            <button className="btn btn-primary" onClick={changeActionButton} data-action="SelectBody">Select</button>
          </div>
          <Speedometer speed={this.state.speed} />
        </div>
      </div>
  }
}