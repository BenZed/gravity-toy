function secondsAsMessage(seconds) {

  let suffix = 'seconds'
  let time = seconds
  let rounder = 1

  if (seconds > 60) {
    suffix = 'minutes'
    time /= 60
    rounder = 10
  }

  if (seconds > 60 * 60) {
    suffix = 'hours'
    time /= 60
  }

  if (seconds > 60 * 60 * 24) {
    suffix = 'days'
    time /= 24
    rounder = 100
  }

  return Math.floor(time * rounder) / rounder + ' ' + suffix
}

export default function Timeline({cached, cachedMax, secondsMax, playhead, ...other}) {

  return <div>

    <div className='timeline' {...other}>
      <div className='timeline-cached' style={{ width: cached / cachedMax * 100 + '%' }}/>
      <div className='timeline-playhead' style={{ width: playhead / cachedMax * 100 + '%' }}/>
    </div>
    <h6 className='right'>{secondsAsMessage(secondsMax)}</h6>
  </div>
}
