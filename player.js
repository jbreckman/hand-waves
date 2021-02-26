
document.body.onclick = () => {
  document.body.onclick = null;

  document.getElementById('instructions').innerText = 'Loading...';
  let v = document.getElementById('v');
  let c = document.getElementById('c');
  let context = c.getContext('2d');

  handTrack.startVideo(v).then(status => {
    


    const HEIGHT = 480, 
          WIDTH = 640,
          NUM_SYNTHS = 1,
          PORTAMENTO = 0.1;
          NOTES = ['B4','D5','G5', 'B5','C6','D6'];

    const modelParams = {
      flipHorizontal: true, // flip e.g for video  
      maxNumBoxes: NUM_SYNTHS, // maximum number of boxes to detect
      imageScaleFactor: 0.6,
      iouThreshold: 0.5, // ioU threshold for non-max suppression
      scoreThreshold: 0.6, // confidence threshold for predictions.
    }

    let synths = [...new Array(NUM_SYNTHS)].map(() => {
      const synth = new Tone.DuoSynth({
        vibratoAmount: 0,
        volume: -10,
        vibratoRate: 10,
      }).toDestination();

      synth.portamento = PORTAMENTO;
      return {
        synth,
        currentNote: null
      };
    })

    handTrack.load(modelParams).then(model => {

      // detect objects in the image.
      setInterval(() => {
        model.detect(v).then(predictions => {
          model.renderPredictions(predictions, c, context, v);

          synths.forEach((synthInfo, index) => {
            if (predictions[index]) {
              let pred = predictions[index],
                  centerX = (pred.bbox[0] + pred.bbox[2] / 2) / WIDTH,
                  centerY = 1 - (pred.bbox[1] + pred.bbox[3] / 2) / HEIGHT;

              let voiceY = Math.min(1, Math.max(0, (centerY - 0.2) * 1.5));
              let desiredNote = NOTES[Math.floor(NOTES.length * voiceY)];

              if (synthInfo.currentNote) {
                synthInfo.synth.setNote(desiredNote);
              }
              else {
                synthInfo.synth.triggerAttack(desiredNote);
              }

              synthInfo.currentNote = desiredNote;

              let vibratoAmount = Math.min(1, Math.max(0,(centerX - 0.25) * 2));
              synthInfo.synth.vibratoAmount.value = vibratoAmount;
              console.log(vibratoAmount);
            }
            else {
              if (synthInfo.currentNote) {
                synthInfo.synth.triggerRelease();
                synthInfo.currentNote = null;
              }
            }
          });

          // for (let note = 0; note < NUM_SYNTHS; note++) {
          //   predictions.forEach((pred, index) => {
          //     let centerX = pred.bbox[0] + pred.bbox[2] / 2,
          //         centerY = pred.bbox[1] + pred.bbox[3] / 2;

          //     console.log(centerX, centerY);
          //   });
          // }
        });
      }, 25);
    });   
  })
};