import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "../database";
import { CategoryWithRelations } from "../types";

export async function GET() {
  try {
    const categories = await getCategories();
    
    // Transform categories to hide internal IDs and use custom IDs
    const cleanCategories = categories.map((category: CategoryWithRelations) => ({
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      postCount: category.postCount,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
    
    return NextResponse.json(cleanCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await createCategory({
      name,
      description: description || null,
      icon: icon || null,
      color: color || null,
      postCount: 0,
      isActive: true,
    });

    // Transform category to hide internal IDs and use custom IDs
    const cleanCategory = {
      categoryId: (category as CategoryWithRelations).categoryId,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      postCount: category.postCount,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
    
    return NextResponse.json(cleanCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
