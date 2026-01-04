import { Parser } from 'json2csv';

export async function getRevenueSummary(req, res) {
  try {
    // MOCKED DATA
    const revenueData = {
      withdrawalTax: 1500,
      depositProfit: 2700,
      totalRevenue: 4200,
    };

    res.status(200).json(revenueData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching revenue summary' });
  }
}


export const downloadRevenueCSV = async (req, res) => {
  try {
    // Sample data structure — replace this with your real DB query
    const summary = [
      { type: 'Deposit', amount: 2000, date: '2025-08-03' },
      { type: 'Withdrawal Tax', amount: 300, date: '2025-08-03' },
      { type: 'Profit', amount: 1700, date: '2025-08-03' },
    ];

    const fields = ['type', 'amount', 'date'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(summary);


       // ✅ Custom filename
    const fileName = `aselarystatement-${new Date().toISOString().slice(0, 10)}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment('revenue-summary.csv');
    res.attachment(fileName);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
};
