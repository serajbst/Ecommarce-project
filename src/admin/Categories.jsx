import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_BASE =
  "http://localhost/ashrafbazar/backend/api/categories";

const CATEGORIES_API =
  `${API_BASE}/index.php`;

const DELETE_CATEGORY_API =
  `${API_BASE}/delete.php`;


/*
|--------------------------------------------------------------------------
| Admin Token
|--------------------------------------------------------------------------
*/

const getAdminToken = () => {
  return localStorage.getItem("admin_token");
};


/*
|--------------------------------------------------------------------------
| Image URL
|--------------------------------------------------------------------------
*/

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  return `/images/categories/${image}`;
};


/*
|--------------------------------------------------------------------------
| Parse API Response
|--------------------------------------------------------------------------
*/

const parseApiResponse = async (response) => {
  let result = null;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Server returned invalid response (${response.status}).`
    );
  }

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return result;
};


/*
|--------------------------------------------------------------------------
| Categories Component
|--------------------------------------------------------------------------
*/

function Categories() {

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);


  /*
  |--------------------------------------------------------------------------
  | Fetch Categories
  |--------------------------------------------------------------------------
  */

  const fetchCategories = useCallback(
    async () => {

      try {

        setLoading(true);
        setError("");

      const token = getAdminToken();

if (!token) {
  throw new Error("Admin session expired. Please login again.");
}

const response = await fetch(
  CATEGORIES_API,
  {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);

        const result =
          await parseApiResponse(
            response
          );

        const apiCategories =
          result?.data?.categories ||
          [];

        const normalizedCategories =
          apiCategories.map(
            (category) => ({

              id:
                Number(category.id),

              name:
                category.name || "",

              slug:
                category.slug || "",

              description:
                category.description || "",

              products:
                Number(
                  category.products ||
                  category.product_count ||
                  0
                ),

              status:
                String(
                  category.status || ""
                ).toLowerCase() ===
                "active"
                  ? "Active"
                  : "Inactive",

              image:
                getImageUrl(
                  category.image
                ),

            })
          );

        setCategories(
          normalizedCategories
        );

      } catch (err) {

        console.error(
          "Fetch Categories Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load categories."
        );

      } finally {

        setLoading(false);

      }

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    fetchCategories();

  }, [fetchCategories]);


  /*
  |--------------------------------------------------------------------------
  | Search + Status Filter
  |--------------------------------------------------------------------------
  */

  const filteredCategories =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();

      return categories.filter(
        (category) => {

          const categoryName =
            String(
              category.name || ""
            ).toLowerCase();

          const categorySlug =
            String(
              category.slug || ""
            ).toLowerCase();

          const matchesSearch =
            searchValue === "" ||
            categoryName.includes(
              searchValue
            ) ||
            categorySlug.includes(
              searchValue
            );

          const matchesStatus =
            statusFilter === "All" ||
            category.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      categories,
      search,
      statusFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | Delete Category
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {

    const category =
      categories.find(
        (item) =>
          Number(item.id) ===
          Number(id)
      );

    if (!category) {
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | Confirmation
    |--------------------------------------------------------------------------
    */

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${category.name}" category?`
      );

    if (!confirmed) {
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | Admin Token
    |--------------------------------------------------------------------------
    */

    const token =
      getAdminToken();

    if (!token) {

      alert(
        "Admin session expired. Please login again."
      );

      return;
    }


    try {

      setDeletingId(
        Number(id)
      );

      setError("");


      /*
      |--------------------------------------------------------------------------
      | DELETE API
      |--------------------------------------------------------------------------
      |
      | Backend expects:
      | DELETE /delete.php?id=123
      |
      */

      const response =
        await fetch(
          `${DELETE_CATEGORY_API}?id=${encodeURIComponent(
            id
          )}`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      /*
      |--------------------------------------------------------------------------
      | Parse Response
      |--------------------------------------------------------------------------
      */

      const result =
        await parseApiResponse(
          response
        );


      /*
      |--------------------------------------------------------------------------
      | Remove From UI
      |--------------------------------------------------------------------------
      */

      setCategories(
        (previous) =>
          previous.filter(
            (item) =>
              Number(item.id) !==
              Number(id)
          )
      );


      /*
      |--------------------------------------------------------------------------
      | Success Message
      |--------------------------------------------------------------------------
      */

      alert(
        result?.message ||
          "Category deleted successfully."
      );

    } catch (err) {

      console.error(
        "Delete Category Error:",
        err
      );


      /*
      |--------------------------------------------------------------------------
      | 409 = Products Assigned
      |--------------------------------------------------------------------------
      */

      if (
        err?.message?.includes(
          "products are assigned"
        )
      ) {

        alert(
          "This category cannot be deleted because products are assigned to it."
        );

      } else {

        alert(
          err?.message ||
            "Unable to delete category."
        );
      }

    } finally {

      setDeletingId(null);

    }
  };


  /*
  |--------------------------------------------------------------------------
  | Toggle Status
  |--------------------------------------------------------------------------
  |
  | NOTE:
  | This only changes UI currently.
  | Backend status update API was not provided.
  |
  */

  const toggleStatus = (id) => {

    setCategories(
      (items) =>
        items.map(
          (item) =>
            Number(item.id) ===
            Number(id)
              ? {
                  ...item,

                  status:
                    item.status ===
                    "Active"
                      ? "Inactive"
                      : "Active",
                }
              : item
        )
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-7xl">


      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your product categories and their visibility.
          </p>

        </div>


        <Link
          to="/admin/categories/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >

          <i className="fa-solid fa-plus"></i>

          Add Category

        </Link>

      </div>


      {/* ================================================================
          FILTERS
      ================================================================ */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">


          {/* Search */}

          <div className="relative">

            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>

            <input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

          </div>


          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >

            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

          </select>

        </div>

      </div>


      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && !loading && (

        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

          <div className="flex items-start gap-3">

            <i className="fa-solid fa-circle-exclamation mt-0.5 text-red-500"></i>

            <div className="flex-1">

              <p className="text-sm font-bold text-red-700">
                Unable to load categories
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            </div>


            <button
              type="button"
              onClick={fetchCategories}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>

        </div>

      )}


      {/* ================================================================
          LOADING
      ================================================================ */}

      {loading && (

        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

          <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading categories...
          </p>

        </div>

      )}


      {/* ================================================================
          DESKTOP TABLE
      ================================================================ */}

      {!loading && (

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Slug
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Products
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filteredCategories.map(
                  (category) => (

                    <tr
                      key={category.id}
                      className="transition hover:bg-slate-50"
                    >


                      {/* Category */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          {category.image ? (

                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-12 w-12 rounded-xl object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />

                          ) : (

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">

                              <i className="fa-solid fa-folder"></i>

                            </div>

                          )}


                          <div>

                            <p className="font-bold text-slate-900">
                              {category.name}
                            </p>

                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {category.description}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* Slug */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        /{category.slug}
                      </td>


                      {/* Products */}

                      <td className="px-6 py-4">

                        <span className="font-bold text-slate-800">
                          {category.products}
                        </span>

                      </td>


                      {/* Status */}

                      <td className="px-6 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(
                              category.id
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                            category.status ===
                            "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >

                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              category.status ===
                              "Active"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          ></span>

                          {category.status}

                        </button>

                      </td>


                      {/* Actions */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">


                          {/* Edit */}

                          <Link
                            to={`/admin/categories/edit/${category.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >

                            <i className="fa-solid fa-pen text-xs"></i>

                          </Link>


                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                category.id
                              )
                            }
                            disabled={
                              deletingId ===
                              Number(
                                category.id
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete"
                          >

                            {deletingId ===
                            Number(
                              category.id
                            ) ? (

                              <i className="fa-solid fa-spinner fa-spin text-xs"></i>

                            ) : (

                              <i className="fa-solid fa-trash text-xs"></i>

                            )}

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* ================================================================
          MOBILE CARDS
      ================================================================ */}

      {!loading && (

        <div className="grid gap-4 lg:hidden">

          {filteredCategories.map(
            (category) => (

              <div
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >

                <div className="flex gap-4">


                  {/* Image */}

                  {category.image ? (

                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />

                  ) : (

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">

                      <i className="fa-solid fa-folder"></i>

                    </div>

                  )}


                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-2">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          /{category.slug}
                        </p>

                      </div>


                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          category.status ===
                          "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {category.status}
                      </span>

                    </div>


                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {category.description}
                    </p>

                  </div>

                </div>


                {/* Bottom */}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                  <span className="text-sm text-slate-500">

                    Products:{" "}

                    <strong className="text-slate-800">
                      {category.products}
                    </strong>

                  </span>


                  <div className="flex gap-2">


                    {/* Edit */}

                    <Link
                      to={`/admin/categories/edit/${category.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      title="Edit"
                    >

                      <i className="fa-solid fa-pen text-xs"></i>

                    </Link>


                    {/* Delete */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          category.id
                        )
                      }
                      disabled={
                        deletingId ===
                        Number(
                          category.id
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete"
                    >

                      {deletingId ===
                      Number(
                        category.id
                      ) ? (

                        <i className="fa-solid fa-spinner fa-spin text-xs"></i>

                      ) : (

                        <i className="fa-solid fa-trash text-xs"></i>

                      )}

                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* ================================================================
          EMPTY
      ================================================================ */}

      {!loading &&
        filteredCategories.length ===
          0 && (

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <i className="fa-regular fa-folder-open text-4xl text-slate-300"></i>

            <h3 className="mt-4 font-heading text-lg font-extrabold text-slate-800">
              No categories found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or filter.
            </p>

          </div>

        )}

    </div>
  );
}


export default Categories;