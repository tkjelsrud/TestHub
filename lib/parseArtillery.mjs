const thresholds = {'fast': 200, 'good': 500, 'slow': 750, 'very slow': 1000};


const getPerformanceLabel = (averageTime) => {
  if (averageTime <= thresholds.fast) {
    return 'fast';
  } else if (averageTime <= thresholds.good) {
    return 'good';
  } else if (averageTime <= thresholds.slow) {
    return 'slow';
  } else {
    return 'very slow';
  }
};

function parseArtilleryResults(testRes, json) {
    testRes.type = 'artillery';
    testRes.category = 'performance';

    try {
      testRes.rate = json.aggregate.rates['http.request_rate'];
    } catch (error) {
      console.error('Parse error - rate: ' + error);
    }

    testRes.startstamp = new Date(json.aggregate.firstMetricAt).toISOString();
    testRes.endstamp = new Date(json.aggregate.lastMetricAt).toISOString();

    testRes.latency.min = json.aggregate.summaries['http.response_time'].min;
    testRes.latency.max = json.aggregate.summaries['http.response_time'].max;
    testRes.latency.avg = json.aggregate.summaries['http.response_time'].mean;
    testRes.latency.median = json.aggregate.summaries['http.response_time'].median;

    testRes.result = getPerformanceLabel(testRes.latency.avg);

    testRes.json = json.aggregate.summaries;
    
    return testRes;
  }
  
export { parseArtilleryResults };