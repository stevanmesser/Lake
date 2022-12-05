import React, { useEffect, useRef } from 'react';

import createScene from './scene';

function App() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      
      createScene(canvas)
    }
  }, [])

  return <canvas ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
        </canvas>
}

export default App;