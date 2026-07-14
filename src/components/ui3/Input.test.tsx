import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatNumericDisplay, NumericInput } from "./Input";

describe("NumericInput presentation contract", () => {
  it("rounds only the unfocused presentation to at most two decimals", () => {
    expect(formatNumericDisplay(127.6969)).toBe("127.7");
    expect(formatNumericDisplay(1.234)).toBe("1.23");
    expect(formatNumericDisplay(1.2)).toBe("1.2");
    expect(formatNumericDisplay(-1.005)).toBe("-1.01");
    expect(formatNumericDisplay(123456789.9876)).toBe("123456789.99");
    expect(formatNumericDisplay(-0)).toBe("0");
  });

  it("uses a truncating text spinbutton so overflow can ellipsize", () => {
    const html = renderToStaticMarkup(<NumericInput ariaLabel="Position X" value={127.6969} />);
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('value="127.7"');
    expect(html).toContain("truncate");
  });
});
