import Papa from "papaparse";
import { Vehicle, Customer, Reservation } from "@/types";

export function exportVehiclesToCsv(vehicles: Vehicle[]): string {
  const exportData = vehicles.map((v) => ({
    "Registration Number": v.registration_number,
    "Make": v.make,
    "Model": v.model,
    "Year": v.year,
    "Category": v.category,
    "Daily Rate ($)": v.daily_rate,
    "Status": v.status,
    "Mileage (mi)": v.mileage,
    "Fuel Type": v.fuel_type,
    "Transmission": v.transmission,
    "Deposit ($)": v.deposit_amount,
    "VIN": v.vin,
    "Color": v.color,
  }));

  return Papa.unparse(exportData);
}

export function exportCustomersToCsv(customers: Customer[]): string {
  const exportData = customers.map((c) => ({
    "Full Name": c.full_name,
    "Email": c.email,
    "Phone": c.phone,
    "Customer Type": c.customer_type,
    "Company": c.company_name || "",
    "City": c.city || "",
    "Country": c.country,
    "Status": c.status,
    "ID Number": c.id_number || "",
  }));

  return Papa.unparse(exportData);
}

export function exportReservationsToCsv(reservations: Reservation[]): string {
  const exportData = reservations.map((r) => ({
    "Reference": r.reference,
    "Customer": r.customer?.full_name || "",
    "Vehicle": r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "",
    "Status": r.status,
    "Pickup Date": r.pickup_datetime,
    "Return Date": r.return_datetime,
    "Total Amount ($)": r.total_amount,
    "Paid Amount ($)": r.amount_paid,
    "Deposit Held ($)": r.deposit_amount,
    "Payment Status": r.payment_status,
  }));

  return Papa.unparse(exportData);
}

export function downloadCsvFile(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseVehicleCsv(fileText: string): Promise<{
  successRows: any[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const successRows: any[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2;
          const reg = row["Registration Number"] || row["registration_number"] || row["reg"];
          const make = row["Make"] || row["make"];
          const model = row["Model"] || row["model"];
          const year = parseInt(row["Year"] || row["year"], 10);
          const dailyRate = parseFloat(row["Daily Rate"] || row["daily_rate"] || row["rate"]);

          if (!reg || !make || !model) {
            errors.push(`Row ${rowNum}: Missing mandatory fields (Registration, Make, or Model).`);
            return;
          }
          if (isNaN(year) || year < 1990 || year > 2030) {
            errors.push(`Row ${rowNum}: Invalid manufacturing year (${year}).`);
            return;
          }
          if (isNaN(dailyRate) || dailyRate <= 0) {
            errors.push(`Row ${rowNum}: Invalid daily rental price (${dailyRate}).`);
            return;
          }

          successRows.push({
            registration_number: String(reg).trim().toUpperCase(),
            make: String(make).trim(),
            model: String(model).trim(),
            year,
            category: (row["Category"] || row["category"] || "sedan").toLowerCase(),
            daily_rate: dailyRate,
            deposit_amount: parseFloat(row["Deposit"] || row["deposit_amount"]) || 500,
            vin: row["VIN"] || row["vin"] || `VIN-${Date.now()}-${index}`,
            transmission: (row["Transmission"] || "automatic").toLowerCase(),
            fuel_type: (row["Fuel"] || "petrol").toLowerCase(),
            color: row["Color"] || "Black",
            mileage: parseInt(row["Mileage"] || "0", 10) || 0,
            status: "available",
            ownership_type: "owned",
            min_rental_days: 1,
            seating_capacity: 5,
            is_active: true,
          });
        });

        resolve({ successRows, errors });
      },
    });
  });
}
