import { NextRequest, NextResponse } from "next/server";
import { preRegistrationRepository } from "@/infrastructure/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generation, name, formData } = body;

    if (!generation || !name || !formData) {
      return NextResponse.json(
        { error: "필수 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const id = await preRegistrationRepository.submitPreRegistration({
      generation,
      name,
      formData,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Pre-registration API error:", error);
    return NextResponse.json(
      { error: "사전등록 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
