export default function Timeline({cached, cachedMax, playhead, ...other}) {

  return <div className='timeline' {...other}>
    <div className='timeline-cached' style={{ width: cached / cachedMax * 100 + '%' }}/>
    <div className='timeline-playhead' style={{ width: playhead / cachedMax * 100 + '%' }}/>
  </div>

}
