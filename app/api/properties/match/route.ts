import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const closr_authToken = req.cookies.get("closr_authToken")?.value;

    if (!closr_authToken) {
      return NextResponse.json({ message: "Unauthorized - No token provided" }, { status: 401 });
    }

    const body = await req.json();

    //console.log("BODY:", body);

    // const targetAreas = body.targetAreas.join(' ');

    const allowsCats = body.petOwned == "both" || body.petOwned == "cat" ? "Yes" : "No";

    const allowsDogs = body.petOwned == "both" || body.petOwned == "dog" ? "Yes" : "No";

    const pool = body.amenities && body.amenities.includes("pool") ? "Yes" : "No";
    const laundry = body.amenities && body.amenities.includes("laundry") ? "Yes" : "No";

    const parking = body.amenities && body.amenities.includes("parking") ? "Yes" : "No";

    const queryParams = new URLSearchParams();

    // Handle home types - process each type in the array
    if (body.homeType && Array.isArray(body.homeType)) {
      body.homeType.forEach((type: string) => {
        if (type === "Condo/Co-op") {
          ["Condo","Condo/Co-Op", "Condos/Co-op", "Condo/Co-op", "Manufactured Home", "Mobile Home", "Other", "Auction"].forEach((t) => {
            queryParams.append("homeType", t);
          });
        } else if (type === "House/Townhouse") {
          ["House/Townhouse", "Other", "Auction"].forEach((t) => {
            queryParams.append("homeType", t);
          });
        } else if (type === "Commercial") {
          ["Commercial", "Other"].forEach((t) => {
            queryParams.append("homeType", t);
          });
        } else if (type === "Lot/Land") {
          ["Lot/Land", "Other"].forEach((t) => {
            queryParams.append("homeType", t);
          });
        } else if (type === "Multi-Family") {
          ["Duplex", "Multi-Family", "Other", "Quadruplex", "Triplex"].forEach((t) => {
            queryParams.append("homeType", t);
          });
        } else if (type === "Room") {
          queryParams.append("homeType", "Room");
        } else if (type === "Apartment") {
          queryParams.append("homeType", "Apartment");
        } else if (type === "House") {
          queryParams.append("homeType", "House");
        }
      });
    }

    // Add all other parameters
    if (body.price) queryParams.append("price", body.price.toString());
    if (body.bedrooms) queryParams.append("bedrooms", body.bedrooms.toString());
    if (body.bathrooms) queryParams.append("bathrooms", body.bathrooms.toString());
    if (body.targetAreas && body.targetAreas.length > 0)
      body.targetAreas.forEach((area: string) => {
        if (area == "Arverne & Rockaways") {
          queryParams.append("targetAreas", "Arverne");
          queryParams.append("targetAreas", "Belle Harbor");
          queryParams.append("targetAreas", "Rockaway Beach");
          queryParams.append("targetAreas", "Rockaway Park");
          queryParams.append("targetAreas", "Far Rockaway");
          queryParams.append("targetAreas", "Breezy Point");
          queryParams.append("targetAreas", "Neponsit");
        } else if (area == "Corona & North Corona") {
          queryParams.append("targetAreas", "Corona");
          queryParams.append("targetAreas", "North Corona");
        } else if (area == "Jamaica & South Jamaica") {
          queryParams.append("targetAreas", "Jamaica");
          queryParams.append("targetAreas", "South Jamaica");
        } else if (area == "Richmond Hill & South Richmond Hill") {
          queryParams.append("targetAreas", "Richmond Hill");
          queryParams.append("targetAreas", "South Richmond Hill");
        } else if (area == "New Dorp & New Dorp Beach") {
          queryParams.append("targetAreas", "New Dorp");
          queryParams.append("targetAreas", "New Dorp Beach");
        } else if (area == "Oakwood & Oakwood Beach") {
          queryParams.append("targetAreas", "Oakwood");
          queryParams.append("targetAreas", "Oakwood Beach");
        } else if (area == "Kingsbridge, Van Cortlandt Village & Park") {
          queryParams.append("targetAreas", "Kingsbridge");
          queryParams.append("targetAreas", "Van Cortlandt Village");
        } else if (area == "Pelham Bay & Pelham Bay Park") {
          queryParams.append("targetAreas", "Pelham Bay");
          queryParams.append("targetAreas", "Pelham Bay Park");
        } else if (area == "South Bronx, Morrisania & Crotona Park East") {
          queryParams.append("targetAreas", "Morrisania");
          queryParams.append("targetAreas", "Crotona Park East");
        } else if (area == "Flatbush & East Flatbush") {
          queryParams.append("targetAreas", "East Flatbush");
          queryParams.append("targetAreas", "Flatbush");
        } else if (area == "Mill Basin & Old Mill Basin") {
          queryParams.append("targetAreas", "Mill Basin");
          queryParams.append("targetAreas", "Old Mill Basin");
        } else if (area == "Central Park & Central Park South") {
          queryParams.append("targetAreas", "Central Park");
          queryParams.append("targetAreas", "Central Park South");
        } else if (area == "Little Italy & Nolita") {
          queryParams.append("targetAreas", "Little Italy");
          queryParams.append("targetAreas", "Nolita");
        } else if (area == "Midtown East, Kips Bay, Sutton Place & Murray Hill") {
          queryParams.append("targetAreas", "Sutton Place");
          queryParams.append("targetAreas", "Murray Hill");
          queryParams.append("targetAreas", "Turtle Bay");
          queryParams.append("targetAreas", "Kips Bay");
        } else if (area == "Bronxwood & Allerton") {
          queryParams.append("targetAreas", "Bronxwood");
        } else if (area == "East Tremont & Crotona") {
          queryParams.append("targetAreas", "East Tremont");
        } else if (area == "Riverdale & Fieldston") {
          queryParams.append("targetAreas", "Riverdale");
        } else if (area == "Soundview & Clason Point") {
          queryParams.append("targetAreas", "Soundview");
        } else if (area == "Tremont & Mt. Hope") {
          queryParams.append("targetAreas", "Tremont");
        } else if (area == "Williamsbridge & Olinville") {
          queryParams.append("targetAreas", "Williamsbridge");
        } else if (area == "East New York & Cypress Hills") {
          queryParams.append("targetAreas", "East New York");
        } else if (area == "Greenwood Heights & South Slope") {
          queryParams.append("targetAreas", "Greenwood");
        } else if (area == "Williamsburg & East Williamsburg") {
          queryParams.append("targetAreas", "Williamsburg");
        } else if (area == "East Village & Alphabet City") {
          queryParams.append("targetAreas", "East Village");
        } else if (area == "Financial District & Seaport") {
          queryParams.append("targetAreas", "Financial District");
        } else if (area == "Flatiron District & Nomad") {
          queryParams.append("targetAreas", "Flatiron District");
        } else if (area == "Greenwich Village & NoHo") {
          queryParams.append("targetAreas", "Greenwich Village");
        } else if (area == "Hamilton Heights & Sugar Hill") {
          queryParams.append("targetAreas", "Hamilton Heights");
        } else if (area == "Harlem (Central Harlem)") {
          queryParams.append("targetAreas", "Harlem");
        } else if (area == "Hudson Square & SoHo") {
          queryParams.append("targetAreas", "SoHo");
        } else if (area == "Midtown South & Koreatown") {
          queryParams.append("targetAreas", "Midtown South");
        } else if (area == "Upper East Side, Lennox Hill & Yorkville") {
          queryParams.append("targetAreas", "Upper East Side");
        } else if (area == "Upper West Side & Lincoln Square") {
          queryParams.append("targetAreas", "Upper West Side");
        } else if (area == "Washington Heights, Hudson Heights & Fort George") {
          queryParams.append("targetAreas", "Washington Heights");
        } else if (area == "West Harlem & Manhattanville") {
          queryParams.append("targetAreas", "West Harlem");
        } else if (area == "Astoria & Ditmars") {
          queryParams.append("targetAreas", "Astoria");
        } else if (area == "Bayside & Bay Terrace") {
          queryParams.append("targetAreas", "Bayside");
        } else if (area == "Flushing & East Flushing") {
          queryParams.append("targetAreas", "Flushing");
        } else if (area == "Howard Beach & Lindenwood") {
          queryParams.append("targetAreas", "Howard Beach");
        } else if (area == "Jamaica Estates & Holliswood") {
          queryParams.append("targetAreas", "Jamaica Estates");
        } else if (area == "Oakland Gardens & Hollis Hills") {
          queryParams.append("targetAreas", "Oakland Gardens");
        } else if (area == "Ozone Park & South Ozone Park") {
          queryParams.append("targetAreas", "Ozone Park");
        } else if (area == "Springfield Gardens & Rochdale") {
          queryParams.append("targetAreas", "Springfield Gardens");
        } else if (area == "Whitestone, Malba & Beechhurst") {
          queryParams.append("targetAreas", "Whitestone");
        } else if (area == "New Springville & Heartland Village") {
          queryParams.append("targetAreas", "New Springville");
        } else if (area == "West New Brighton & West Brighton") {
          queryParams.append("targetAreas", "West Brighton");
        } else {
          queryParams.append("targetAreas", area);
        }
      });
    if (body.petOwned) queryParams.append("petFriendly.allowsCats", allowsCats);
    if (body.petOwned) queryParams.append("petFriendly.allowsLargeDogs", allowsDogs);
    if (pool === "Yes") queryParams.append("amenities.pool", pool);
    if (laundry === "Yes") queryParams.append("amenities.laundry", laundry);
    if (parking === "Yes") queryParams.append("amenities.parking", parking);
    if (body.mode === "for-rent") queryParams.append("mode", "for-rent");
    if (body.mode === "for-sale") queryParams.append("mode", "for-sale");
    queryParams.append("limit", "100");

    //console.log("QUERY PARAMS:", queryParams);

    const response = await api.get(`/properties/matches?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${closr_authToken}`,
      },
    });

    // //console.log("RESPONSE:", response.data.data.properties);

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
