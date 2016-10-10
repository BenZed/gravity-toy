export default function Timeline({cached, cachedMax, playhead, ...other}) {

  return <div id='timeline' {...other}>
    <div id='timeline-cached' style={{ width: cached / cachedMax * 100 + '%' }}/>
    <div id='timeline-playhead' style={{ width: playhead / cachedMax * 100 + '%' }}/>
  </div>
}
