import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();

    //console.log('BODY:', body);

    const targetAreas = body.targetAreas.join(" ");
    const creditScores = [];

    if (body.creditScore) {
      if (body.creditScore >= 500 && body.creditScore <= 524) {
        creditScores.push(
          "500-524",
          "525-549",
          "550-574",
          "575-599",
          "600-624",
          "625-649",
          "650-674",
          "675-699",
          "700-724",
          "725-749",
          "750-774",
          "775-799",
          "800+"
        );
      } else if (body.creditScore >= 525 && body.creditScore <= 549) {
        creditScores.push(
          "525-549",
          "550-574",
          "575-599",
          "600-624",
          "625-649",
          "650-674",
          "675-699",
          "700-724",
          "725-749",
          "750-774",
          "775-799",
          "800+"
        );
      } else if (body.creditScore >= 550 && body.creditScore <= 574) {
        creditScores.push(
          "550-574",
          "575-599",
          "600-624",
          "625-649",
          "650-674",
          "675-699",
          "700-724",
          "725-749",
          "750-774",
          "775-799",
          "800+"
        );
      } else if (body.creditScore >= 575 && body.creditScore <= 599) {
        creditScores.push(
          "575-599",
          "600-624",
          "625-649",
          "650-674",
          "675-699",
          "700-724",
          "725-749",
          "750-774",
          "775-799",
          "800+"
        );
      } else if (body.creditScore >= 600 && body.creditScore <= 624) {
        creditScores.push(
          "600-624",
          "625-649",
          "650-674",
          "675-699",
          "700-724",
          "725-749",
          "750-774",
          "775-799",
          "800+"
        );
      } else if (body.creditScore >= 625 && body.creditScore <= 649) {
        creditScores.push("625-649", "650-674", "675-699", "700-724", "725-749", "750-774", "775-799", "800+");
      } else if (body.creditScore >= 650 && body.creditScore <= 674) {
        creditScores.push("650-674", "675-699", "700-724", "725-749", "750-774", "775-799", "800+");
      } else if (body.creditScore >= 675 && body.creditScore <= 699) {
        creditScores.push("675-699", "700-724", "725-749", "750-774", "775-799", "800+");
      } else if (body.creditScore >= 700 && body.creditScore <= 724) {
        creditScores.push("700-724", "725-749", "750-774", "775-799", "800+");
      } else if (body.creditScore >= 725 && body.creditScore <= 749) {
        creditScores.push("725-749", "750-774", "775-799", "800+");
      } else if (body.creditScore >= 750 && body.creditScore <= 774) {
        creditScores.push("750-774", "775-799", "800+");
      } else if (body.creditScore >= 775 && body.creditScore <= 799) {
        creditScores.push("775-799", "800+");
      } else if (body.creditScore >= 800) {
        creditScores.push("800+");
      }
    }

    const queryParams = new URLSearchParams();

    if (body.maxBudget) {
      queryParams.append("price", body.maxBudget);
    }

    if (body.searchRange) {
      queryParams.append("searchRange", body.searchRange);
    }

    if (body.bedrooms) {
      // If it's already a "plus" format (e.g. "1+"), just send it as is
      if (body.bedrooms.toString().includes("+")) {
        queryParams.append("bedroomCount", body.bedrooms.toString());
      } else {
        const numBedrooms = parseInt(body.bedrooms.toString());
        // First add the exact number
        queryParams.append("bedroomCount", numBedrooms.toString());
        // Then add the "+" version of the number
        queryParams.append("bedroomCount", `${numBedrooms}+`);
        // Then add all ranges from (numBedrooms-1)+ down to 0+
        for (let i = numBedrooms - 1; i >= 0; i--) {
          queryParams.append("bedroomCount", `${i}+`);
        }
      }
    }

    if (body.bathrooms) {
      // If it's already a "plus" format (e.g. "1+"), just send it as is
      if (body.bathrooms.toString().includes("+")) {
        queryParams.append("bathroomCount", body.bathrooms.toString());
      } else {
        const numBathrooms = parseInt(body.bathrooms.toString());
        // First add the exact number
        queryParams.append("bathroomCount", numBathrooms.toString());
        // Then add the "+" version of the number
        queryParams.append("bathroomCount", `${numBathrooms}+`);
        // Then add all ranges from (numBathrooms-1)+ down to 0+
        for (let i = numBathrooms - 1; i >= 0; i--) {
          queryParams.append("bathroomCount", `${i}+`);
        }
      }
    }

    if (body.targetAreas && body.targetAreas.length > 0) {
      queryParams.append("targetAreas", targetAreas);
    }

    if (body.contactType) {
      queryParams.append("contactType", body.contactType);
    }

    queryParams.append("limit", "100");

    if (body.creditScore && creditScores.length > 0) {
      creditScores.forEach((creditScore: string) => {
        queryParams.append("creditScore", creditScore);
      });
    }

    console.log("QUERY PARAMS:", queryParams);

    const response = await api.get(`/rolodex/matches?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    //console.log(response.data);

    if (response.status !== 200) {
      return NextResponse.json(
        {
          message: response.data.message || "Failed to fetch matching properties",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching matching properties:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          message: "Failed to fetch matching properties",
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
