import { useEffect, useState } from "react";
import { DatePicker, Checkbox, Button, Space } from "antd";
import { RangePickerProps } from "antd/lib/date-picker";
import { daysShort } from "./utils";
import dayjs from "dayjs";

type ResponseData = {
  draw_date: string;
  winning_numbers: string;
  cash_ball: string;
};
type DrawData = {
  draw_date: dayjs.Dayjs;
  winning_numbers: number[];
  cash_ball: number;
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
  const [csvData, setCSVData] = useState<DrawData[]>([]);
  const [filteredData, setfilteredData] = useState<DrawData[]>([]);

  const [winNums, setWinNums] = useState<NumDataGroup>({});
  const [cbNums, setcbNums] = useState<NumDataGroup>({});

  const [selectedDays, setSelectedDays] = useState(daysShort);
  const [dateRange, setDateRange] = useState<RangePickerProps["value"]>([
    dayjs(),
    dayjs(),
  ]);

  const [genWinNumResults, setGenWinNumResults] = useState<number[]>([]);
  const [genCBResults, setGenCBResults] = useState<string>("");

  useEffect(() => {
    if (csvData.length > 0) {
      console.log(csvData[0].draw_date, csvData[csvData.length - 2].draw_date);
      setDateRange([
        dayjs(csvData[csvData.length - 2].draw_date),
        dayjs(csvData[0].draw_date),
      ]);
    }
  }, [csvData]);

  useEffect(() => {
    console.log("days", selectedDays);
    const filtered = csvData.filter((result) => {
      const draw_date = result.draw_date;
      const drawDateWkDay = draw_date.format("ddd");
      let res = selectedDays.includes(drawDateWkDay);
      if (dateRange) {
        res =
          res &&
          draw_date.isAfter(dateRange[0]) &&
          draw_date.isBefore(dateRange[1]);
      }
      return res;
    });
    setfilteredData(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, dateRange]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        "https://data.ny.gov/resource/kwxv-fwze.json"
      ).then((response) => response.json());
      const data = response.map((ent: ResponseData) => {
        return {
          draw_date: dayjs(ent.draw_date),
          winning_numbers: ent.winning_numbers
            ? ent.winning_numbers.split(" ").map((n) => Number(n))
            : [],
          cash_ball: Number(ent.cash_ball),
        };
      });
      setCSVData(data);
      setfilteredData(data);
      console.log("res", response);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cashBallFrequency: { [n: string]: number } = {};
    const winningNumbersFrequency: { [n: string]: number } = {};
    const cashBallObj: NumDataGroup = {};
    const winningNumbersObj: NumDataGroup = {};

    filteredData.forEach((result) => {
      const cash_ball = result.cash_ball;
      const winning_numbers = result.winning_numbers;
      winning_numbers.forEach((num) => {
        winningNumbersFrequency[num] = winningNumbersFrequency[num]
          ? winningNumbersFrequency[num] + 1
          : 1;
      });
      if (!isNaN(cash_ball)) {
        cashBallFrequency[cash_ball] = cashBallFrequency[cash_ball]
          ? cashBallFrequency[cash_ball] + 1
          : 1;
      }
    });

    const cashBallVals = Object.values(cashBallFrequency);
    const cashBallValsMin = Math.min(...cashBallVals);
    const cashBallValsMax = Math.max(...cashBallVals);
    console.log(cashBallVals, cashBallValsMin, cashBallValsMax);
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
    setWinNums(winningNumbersObj);
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
      let res = Number(getRandom(winNums));
      while (numsGen.includes(res)) {
        res = Number(getRandom(winNums));
      }
      numsGen.push(res);
    }
    setGenCBResults(cbGen);
    setGenWinNumResults(numsGen.sort((a, b) => a - b));
    console.log(numsGen.sort((a, b) => a - b).toString());
    console.log(cbGen);
  }

  return (
    <>
      <div>
        <Space size="small">
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
                dayjs(csvData[0].draw_date).subtract(3, "month"),
                dayjs(csvData[0].draw_date),
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
                dayjs(csvData[0].draw_date).subtract(6, "month"),
                dayjs(csvData[0].draw_date),
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
                dayjs(csvData[0].draw_date).subtract(1, "year"),
                dayjs(csvData[0].draw_date),
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
                dayjs(csvData[0].draw_date).subtract(2, "year"),
                dayjs(csvData[0].draw_date),
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
                dayjs(csvData[csvData.length - 2].draw_date),
                dayjs(csvData[0].draw_date),
              ])
            }
          >
            full range
          </Button>
        </Space>
      </div>

      <div>
        <Checkbox.Group
          options={daysShort}
          value={selectedDays}
          onChange={(days) => setSelectedDays(days)}
        />
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => setSelectedDays(daysShort)}
          >
            all days
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => setSelectedDays([])}
          >
            clear days
          </Button>
        </Space>
      </div>

      <div className="main">
        {filteredData.length > 0 ? (
          <>
            <p>{`[${filteredData[filteredData.length - 2].draw_date.format(
              "DD-MM-YYYY"
            )} - ${filteredData[0].draw_date.format("DD-MM-YYYY")}]   ${
              filteredData.length
            } draws  `}</p>
          </>
        ) : (
          <p>select day</p>
        )}

        <div className="container">
          {allNums.map((key) => (
            <div
              key={key}
              className={`item ${
                genWinNumResults.includes(key) ? "highlight" : ""
              }`}
              style={{
                backgroundColor: `color-mix(in srgb, blue  ${
                  winNums[key] ? winNums[key].mapped : 0
                }%, transparent)`,
              }}
            >
              <div className="item-data">
                <b>{key}</b>
                {winNums[key] && (
                  <>
                    <p>{winNums[key].percentage.toFixed(2)}</p>
                    <p>{winNums[key].frequency}</p>
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
            {genWinNumResults.map((num) => (
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
