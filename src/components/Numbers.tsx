import { useEffect, useState } from "react";
import { DatePicker, Checkbox, Button } from "antd";
import { RangePickerProps } from "antd/lib/date-picker";
import { daysShort } from "./utils";
// import dayjs from "dayjs";
import dayjs from "dayjs";
// import dayjs,{Dayjs} from "dayjs";
type CSVData = {
  drawDate: string;
  winningNumbers: number[];
  cashBall: number;
};

type NumData = {
  frequency: number;
  percentage: number;
  mapped: number;
};
type NumDataGroup = {
  [n: string]: NumData;
};
const { RangePicker } = DatePicker;

function Numbers() {
  const allNums = new Array(60).fill(0).map((_, i) => i + 1);
  const [csvData, setCSVData] = useState<CSVData[]>([]);
  const [filteredData, setfilteredData] = useState<CSVData[]>([]);

  const [nums, setNums] = useState<NumDataGroup>({});
  const [cbNums, setcbNums] = useState<NumDataGroup>({});

  const [selectedDays, setSelectedDays] = useState(daysShort);
  const [dateRange, setDateRange] = useState<RangePickerProps["value"]>([
    dayjs(),
    dayjs(),
  ]);

  const [genNumResults, setGenNumResults] = useState<number[]>([]);
  const [genCBResults, setGenCBResults] = useState<string>("");
  useEffect(() => {
    if (csvData.length > 0) {
      console.log(csvData[0].drawDate, csvData[csvData.length - 2].drawDate);
      setDateRange([
        dayjs(csvData[csvData.length - 2].drawDate),
        dayjs(csvData[0].drawDate),
      ]);
    }
  }, [csvData]);

  useEffect(() => {
    console.log("days", selectedDays);
    const filtered = csvData.filter((result) => {
      const drawDate = dayjs(result.drawDate);
      const drawDateWkDay = drawDate.format("ddd");
      let res = selectedDays.includes(drawDateWkDay);
      if (dateRange) {
        res =
          res &&
          drawDate.isAfter(dateRange[0]) &&
          drawDate.isBefore(dateRange[1]);
      }
      return res;
    });
    setfilteredData(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, dateRange]);

  useEffect(() => {
    fetchCsv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cashBallFrequency: { [n: string]: number } = {};
    const winningNumbersFrequency: { [n: string]: number } = {};
    const cashBallObj: NumDataGroup = {};
    const winningNumbersObj: NumDataGroup = {};

    filteredData.forEach((result) => {
      const cashBall = result.cashBall;
      const winningNumbers = result.winningNumbers;
      winningNumbers.forEach((num) => {
        winningNumbersFrequency[num] = winningNumbersFrequency[num]
          ? winningNumbersFrequency[num] + 1
          : 1;
      });
      if (!isNaN(cashBall)) {
        cashBallFrequency[cashBall] = cashBallFrequency[cashBall]
          ? cashBallFrequency[cashBall] + 1
          : 1;
      }
    });

    const cashBallVals = Object.values(cashBallFrequency);
    const cashBallValsMin = Math.min(...cashBallVals);
    const cashBallValsMax = Math.max(...cashBallVals);
    console.log(cashBallValsMin, cashBallValsMax);
    Object.keys(cashBallFrequency).forEach((key) => {
      cashBallObj[key] = {
        frequency: cashBallFrequency[key],
        percentage: (cashBallFrequency[key] / filteredData.length) * 100,
        mapped: remapper(
          cashBallFrequency[key],
          cashBallValsMin,
          cashBallValsMax,
          1,
          100
        ),
      };
    });
    const winningNumbersVals = Object.values(winningNumbersFrequency);
    const winningNumbersValsMin = Math.min(...winningNumbersVals);
    const winningNumbersValsMax = Math.max(...winningNumbersVals);
    Object.keys(winningNumbersFrequency).forEach((key) => {
      winningNumbersObj[key] = {
        frequency: winningNumbersFrequency[key],

        percentage:
          (winningNumbersFrequency[key] / (filteredData.length * 5)) * 100,
        mapped: remapper(
          winningNumbersFrequency[key],
          winningNumbersValsMin,
          winningNumbersValsMax,
          1,
          100
        ),
      };
    });
    setcbNums(cashBallObj);
    setNums(winningNumbersObj);
    console.log(cashBallObj);
    console.log(winningNumbersObj);
    // let winningNumbersObjSorted = Object.entries(winningNumbersObj).sort(
    //   (a, b) => b[1] - a[1]
    // );
    // console.log(winningNumbersObjSorted);
  }, [filteredData]);

  function remapper(
    x: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ) {
    return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  async function fetchCsv() {
    const response = await fetch(
      "Lottery_Cash_4_Life_Winning_Numbers__Beginning_2014_20240519.csv"
    ).then((response) => response.text());
    const csv = parseCSV(response);
    setCSVData(csv);
    setfilteredData(csv);
    console.log(csvData);
  }

  function parseCSV(data: string): CSVData[] {
    const lines = data.split("\n");
    const result: CSVData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(",");
      const obj = {
        drawDate: currentLine[0],
        winningNumbers: currentLine[1]
          ? currentLine[1].split(" ").map((n) => Number(n))
          : [],
        cashBall: Number(currentLine[2]),
      };

      result.push(obj);
    }

    return result;
  }

  function getRandom(obj: NumDataGroup) {
    console.log(obj);
    // Create an array to hold the keys and their cumulative percentages
    const cumulativePercentages: { key: string; cumulative: number }[] = [];
    let cumulativeSum = 0;
    let res = "";

    // Populate the cumulative percentages array
    // eslint-disable-next-line prefer-const
    Object.keys(obj).forEach((key) => {
      cumulativeSum += obj[key].percentage;
      cumulativePercentages.push({ key: key, cumulative: cumulativeSum });
    });

    // Generate a random number between 0 and 100
    const random = Math.random() * 100;

    // Find the key corresponding to the random number
    for (let i = 0; i < cumulativePercentages.length; i++) {
      if (random < cumulativePercentages[i].cumulative) {
        // return cumulativePercentages[i].key;
        res = cumulativePercentages[i].key;
        break;
      }
    }
    console.log(cumulativePercentages);
    // Fallback in case of any error (should not happen)
    return res;
  }

  function generate() {
    const cbGen = getRandom(cbNums);

    // eslint-disable-next-line prefer-const
    let numsGen: number[] = [];
    for (let i = 0; i < 5; i++) {
      let res = Number(getRandom(nums));
      while (numsGen.includes(res)) {
        res = Number(getRandom(nums));
      }
      numsGen.push(res);
    }
    setGenCBResults(cbGen);
    setGenNumResults(numsGen.sort((a, b) => a - b));
    console.log(numsGen.sort((a, b) => a - b).toString());
    console.log(cbGen);
  }

  return (
    <>
      <div>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          format="MM/DD/YYYY"
        />
        <Button
          type="primary"
          size="small"
          onClick={() =>
            setDateRange([
              dayjs(csvData[0].drawDate).subtract(3, "month"),
              dayjs(csvData[0].drawDate),
            ])
          }
        >
          3 month
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() =>
            setDateRange([
              dayjs(csvData[0].drawDate).subtract(6, "month"),
              dayjs(csvData[0].drawDate),
            ])
          }
        >
          6 month
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() =>
            setDateRange([
              dayjs(csvData[0].drawDate).subtract(1, "year"),
              dayjs(csvData[0].drawDate),
            ])
          }
        >
          1 year
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() =>
            setDateRange([
              dayjs(csvData[0].drawDate).subtract(2, "year"),
              dayjs(csvData[0].drawDate),
            ])
          }
        >
          2 year
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() =>
            setDateRange([
              dayjs(csvData[csvData.length - 2].drawDate),
              dayjs(csvData[0].drawDate),
            ])
          }
        >
          full range
        </Button>
      </div>

      <div>
        <Checkbox.Group
          options={daysShort}
          value={selectedDays}
          onChange={(days) => setSelectedDays(days)}
        />
        <Button
          type="primary"
          size="small"
          onClick={() => setSelectedDays(daysShort)}
        >
          all days
        </Button>
        <Button type="primary" size="small" onClick={() => setSelectedDays([])}>
          clear days
        </Button>
      </div>

      <div className="main">
        {filteredData.length > 0 ? (
          <>
            <p>{`[${filteredData[filteredData.length - 2].drawDate} - ${
              filteredData[0].drawDate
            }]   ${filteredData.length} draws  `}</p>
          </>
        ) : (
          <p>select day</p>
        )}

        <div className="container">
          {/* {Object.entries(nums).map(([key, value]) => ( */}
          {allNums.map((key) => (
            <div
              key={key}
              className={`item ${
                genNumResults.includes(key) ? "highlight" : ""
              }`}
              style={{
                backgroundColor: `color-mix(in srgb, blue  ${
                  nums[key] ? nums[key].mapped : 0
                }%, transparent)`,
              }}
            >
              <div className="item-data">
                <b>{key}</b>
                {nums[key] && (
                  <>
                    <p>{nums[key].percentage.toFixed(2)}</p>
                    <p>{nums[key].frequency}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="container cb_container">
          {Object.entries(cbNums).map(([key, value]) => (
            <div
              key={key}
              className={`item ${genCBResults === key ? "highlight" : ""}`}
              style={{
                backgroundColor: `color-mix(in srgb, red  ${value.mapped}%, transparent)`,
              }}
            >
              <div className="item-data">
                <b>{key}</b>
                <p>{value.percentage.toFixed(2)}</p>
                <p>{value.frequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Button type="primary" onClick={() => generate()}>
          generate
        </Button>
        <div>
          <p>
            {genNumResults.map((num) => (
              <span key={num}>{num} </span>
            ))}
          </p>
          <p>{genCBResults}</p>
        </div>
      </div>
    </>
  );
}

export default Numbers;
