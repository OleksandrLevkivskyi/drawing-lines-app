import { useRef, useEffect, useState } from "react";
import "./App.css";

function App() {
  const canvas = useRef();
  const [isDrawing, setIsDrawing] = useState(null);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [canvasLines, setCanvasLines] = useState([]);
  const [canvasPoints, setCanvasPoints] = useState([]);
  let ctx = null;

  useEffect(() => {
    const canvasEle = canvas.current;
    canvasEle.width = canvasEle.clientWidth;
    canvasEle.height = canvasEle.clientHeight;

    ctx = canvasEle.getContext("2d");
  }, []);

  useEffect(() => {
    if (!canvas.current) return;
    ctx = canvas.current.getContext("2d");
    ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
    canvasLines.map((line) => drawLine(line));

    const intersectPoints = [];
    canvasLines.map((line1) => {
      canvasLines.forEach((line2) => {
        if (line1 !== line2) {
          const pointXY = intersect(
            line1.x,
            line1.y,
            line1.x1,
            line1.y1,
            line2.x,
            line2.y,
            line2.x1,
            line2.y1
          );
          if (pointXY) {
            intersectPoints.push(pointXY);
          }
        }
      });
    });
    setCanvasPoints(intersectPoints);
  }, [canvasLines]);

  useEffect(() => {
    ctx = canvas.current.getContext("2d");
    canvasPoints.map((point) => drawPoint(point.x, point.y));
  }, [canvasPoints]);

  useEffect(() => {
    if (isDrawing === null) {
      setCanvasLines(canvasLines.filter((line) => !line.isDrawing));
      return;
    }
    const currentLine = {
      x: start.x,
      y: start.y,
      x1: end.x,
      y1: end.y,
      isDrawing,
    };
    if (!isDrawing) {
      const tempCanvasLines = canvasLines.map((line, index) => {
        if (line.isDrawing) {
          return currentLine;
        }
        return line;
      });
      setCanvasLines(tempCanvasLines);
    } else {
      if (canvasLines.some((line) => line.isDrawing)) {
        const tempCanvasLines = canvasLines.map((line, index) => {
          if (line.isDrawing) {
            return currentLine;
          }
          return line;
        });
        setCanvasLines(tempCanvasLines);
      } else {
        setCanvasLines([...canvasLines, currentLine]);
      }
    }
    console.log(canvasLines);
  }, [isDrawing, start, end]);

  const drawLine = (info) => {
    const { x, y, x1, y1, options } = info;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = options?.color;
    ctx.lineWidth = options?.width;
    ctx.stroke();
  };

  function startDrawNewLine(e) {
    setIsDrawing(true);
    setStart({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
    setEnd({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
  }

  function drawPoint(x, y, color = "#ff0000", size = 3) {
    var pointX = Math.round(x);
    var pointY = Math.round(y);

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(pointX, pointY, size, 0 * Math.PI, 2 * Math.PI);
    ctx.fill();
  }

  function endDrawNewLine(e) {
    setIsDrawing(false);
  }

  function mouseClick(e) {
    if (e.type === "click") {
      if (!isDrawing) {
        startDrawNewLine(e);
      } else {
        endDrawNewLine(e);
      }
    }
  }
  function mousemove(e) {
    if (!isDrawing) return;
    setEnd({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
  }

  function cancelDrawingPath(e) {
    e.stopPropagation();
    e.preventDefault();
    setIsDrawing(null);
    setStart({ x: 0, y: 0 });
    setEnd({ x: 0, y: 0 });
  }

  function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
      return false;
    }

    let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denominator === 0) {
      return false;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
      return false;
    }

    let x = x1 + ua * (x2 - x1);
    let y = y1 + ua * (y2 - y1);

    return { x, y };
  }

  function clearCanvas() {
    let partialFragment = [];
    const fpsRate = 30;
    const animationTimeInSeconds = 3;

    const partialRate = fpsRate * animationTimeInSeconds;
    partialFragment = canvasLines.map((line) => {
      const xPartial = Math.abs(line.x - line.x1) / partialRate;
      const yPartial = Math.abs(line.y - line.y1) / partialRate;
      return {
        xPartial,
        yPartial,
      };
    });

    let counter = 0;
    const interval = setInterval(() => {
      counter++;

      const isResetInterval = canvasLines.length
        ? canvasLines.some((line, index) => {
            const isXLengthSmallerThenXPartial =
              Math.abs(line.x - line.x1) < partialFragment[index].xPartial;
            const isYLengthSmallerThenYPartial =
              Math.abs(line.y - line.y1) < partialFragment[index].yPartial;
            return isXLengthSmallerThenXPartial && isYLengthSmallerThenYPartial;
          })
        : true;
      if (isResetInterval || counter > partialRate) {
        clearInterval(interval);
        setCanvasLines([]);
        return;
      }

      const newCanvasLines = canvasLines.map((line, index) => {
        if (line.x < line.x1) {
          line.x = line.x + partialFragment[index].xPartial;
          line.x1 = line.x1 - partialFragment[index].xPartial;
        } else {
          line.x = line.x - partialFragment[index].xPartial;
          line.x1 = line.x1 + partialFragment[index].xPartial;
        }

        if (line.y < line.y1) {
          line.y = line.y + partialFragment[index].yPartial;
          line.y1 = line.y1 - partialFragment[index].yPartial;
        } else {
          line.y = line.y - partialFragment[index].yPartial;
          line.y1 = line.y1 + partialFragment[index].yPartial;
        }

        return line;
      });
      setCanvasLines([...newCanvasLines]);
    }, (animationTimeInSeconds * 1000) / partialRate);
  }

  return (
    <div className="App">
      <canvas
        ref={canvas}
        onClick={mouseClick}
        onMouseMove={mousemove}
        onContextMenu={cancelDrawingPath}
        width="800"
        height="500"
        style={{ border: "1px solid red", marginTop: "10px" }}
      ></canvas>
      <button
        style={{
          border: "1px solid red",
          marginTop: "10px",
          color: "red",
          backgroundColor: "white",
          width: "100px",
          height: "30px",
        }}
        type="button"
        onClick={clearCanvas}
      >
        collapse lines
      </button>
    </div>
  );
}

export default App;
