export type Granularity = 'TOTAL' | 'DAY' | 'HOUR';

export interface AdReportStats {
    // Core metrics
    impressions?: number;
    swipe_up_percent?: number;
    spend?: number;

    // Conversion metrics (optional - may not be available for all ads)
    conversion_purchases?: number;
    conversion_purchases_value?: number;
    conversion_start_checkout?: number;
    conversion_add_billing?: number;

    // Attribution breakdown (optional - only for enhanced views)
    conversion_purchases_swipe_up?: number;
    conversion_purchases_view?: number;
    conversion_purchases_engaged_view?: number;
    conversion_start_checkout_value?: number;
    conversion_start_checkout_swipe_up?: number;
    conversion_start_checkout_view?: number;
    conversion_add_billing_value?: number;
    conversion_add_billing_swipe_up?: number;
    conversion_add_billing_view?: number;
}

export interface TimeseriesDataPoint {
    start_time: string;
    end_time: string;
    stats: AdReportStats;
}

export interface AdReportResponse {
    request_status: string;
    total_stats?: Array<{
        total_stat: {
            stats: AdReportStats;
            finalized_data_end_time?: string;
            conversion_data_processed_end_time?: string;
        };
    }>;
    timeseries_stats?: Array<{
        timeseries_stat: {
            timeseries: TimeseriesDataPoint[];
            finalized_data_end_time?: string;
            conversion_data_processed_end_time?: string;
        };
    }>;
}
