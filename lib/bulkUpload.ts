import * as XLSX from "xlsx";

// Define the structure for our Excel template
export interface BulkImportRow {
  "First Name": string;
  "Last Name": string;
  Phone: string;
  Email: string;
  "Lead Type": string;
  "Property Address"?: string;
  County?: string;
  "Zip Code"?: string;
}

export interface BulkImportTemplate {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  leadType: string;
  propertyAddress?: string;
  propertyCounty?: string;
  propertyZipcode?: string;
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Parse Excel file and convert to LeadsBuyer array
export const parseExcelFile = async (file: File): Promise<{ data: BulkImportTemplate[]; errors: string[] }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const errors: string[] = [];

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<BulkImportRow>(worksheet);

        // Validate and convert data
        const leadsBuyers: BulkImportTemplate[] = [];

        jsonData.forEach((row, index) => {
          try {
            // Validate required fields
            if (
              !row["Property Address"] ||
              !row["County"] ||
              !row["Zip Code"] ||
              (!row["Phone"] && !row["Email"]) // require at least one
            ) {
              errors.push(
                `Row ${
                  index + 2
                }: Missing required fields (Property Address, County, Zip Code, and either Phone or Email)`
              );
              return;
            }

            const buyer: BulkImportTemplate = {
              firstName: row["First Name"] || "",
              lastName: row["Last Name"] || "",
              phoneNumber: row["Phone"]?.toString() || "",
              email: row["Email"] || "",
              leadType: capitalizeFirstLetter(row["Lead Type"]) || "",
              propertyAddress: row["Property Address"],
              propertyCounty: row["County"],
              propertyZipcode: row["Zip Code"]?.toString(),
              ...((row["Property Address"] || row["County"]) && { propertyState: "NY" }),
            };

            leadsBuyers.push(buyer);
          } catch (err) {
            errors.push(`Row ${index + 3}: ${err instanceof Error ? err.message : "Invalid data"}`);
          }
        });

        resolve({ data: leadsBuyers, errors });
      } catch (_error) {
        errors.push("Failed to parse Excel file");
        resolve({ data: [], errors });
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseExcelBuyerFile = async (file: File): Promise<{ data: BulkImportTemplate[]; errors: string[] }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const errors: string[] = [];

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<BulkImportRow>(worksheet);

        // Validate and convert data
        const leadsBuyers: BulkImportTemplate[] = [];

        jsonData.forEach((row, index) => {
          try {
            // Validate required fields
            if (!row["Phone"] && !row["Email"]) {
              errors.push(`Row ${index + 2}: Missing required fields (need Phone or Email)`);
              return;
            }

            const buyer: BulkImportTemplate = {
              firstName: row["First Name"] || "",
              lastName: row["Last Name"] || "",
              phoneNumber: row["Phone"]?.toString() || "",
              email: row["Email"] || "",
              leadType: capitalizeFirstLetter(row["Lead Type"]) || "",
            };

            leadsBuyers.push(buyer);
          } catch (err) {
            errors.push(`Row ${index + 3}: ${err instanceof Error ? err.message : "Invalid data"}`);
          }
        });

        resolve({ data: leadsBuyers, errors });
      } catch (_error) {
        errors.push("Failed to parse Excel file");
        resolve({ data: [], errors });
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

// Validate file type and size
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];

  if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx")) {
    return { valid: false, error: "Please upload an Excel file (.xlsx)" };
  }

  // Check file size (12MB limit)
  const maxSize = 12 * 1024 * 1024; // 12MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 12MB" };
  }

  return { valid: true };
};
