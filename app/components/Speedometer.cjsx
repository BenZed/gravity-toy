
#private danglers
qualityString = -> 
  pipes = ""
  i = 100
  while i > @props.speed
    i -= 2.5
    pipes += "|"

  pipes

calcStyle = ->

  oDelta = 0.05
  oDelta *= -1 if @props.speed >= 100
  @style.opacity += oDelta
  @style.color = '#00FF00'

  @style

Speedometer = React.createClass

  componentWillMount: ->
    @style =
      opacity: 0
      color: '#00ff00'
      position: 'absolute'
      left: 25
      top: 25

  render: ->

    style = calcStyle.call this
    quality = qualityString.call this

    <span style={style} className='glyphicon glyphicon-hourglass'>
      <strong>{quality}</strong>
    </span>

module.exports = Speedometer
